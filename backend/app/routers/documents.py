"""Document upload + RAG query endpoints.

POST /api/upload-doc : accept a PDF/DOCX, extract text, chunk it, embed the
                       chunks and store everything in PostgreSQL (pgvector).
POST /api/ask-rag    : embed the question, run a pgvector cosine similarity
                       search, ground an LLM answer in the retrieved chunks.
GET  /api/documents  : list indexed documents.
DELETE /api/documents/{id} : remove a document and its chunks.
"""

import re
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.db import vector_support
from app.db.session import get_db
from app.models import Document, DocumentChunk, QueryHistory
from app.schemas import (
    AskRagRequest,
    AskRagResponse,
    DocumentOut,
    LectureAskRequest,
    LectureAskResponse,
    LectureCitation,
    RagSource,
    UploadDocResponse,
)
from app.services.chunking import chunk_pages
from app.services.embeddings import embed_query, embed_texts, get_provider
from app.services.llm import generate_answer
from app.services.text_extraction import extract_pages

router = APIRouter(tags=["rag"])
limiter = Limiter(key_func=get_remote_address)

ALLOWED_TYPES = {"pdf": "pdf", "docx": "docx", "doc": "docx"}


@router.post("/upload-doc", response_model=UploadDocResponse, status_code=201)
@limiter.limit("10/hour")
async def upload_doc(request: Request, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Index an uploaded PDF or DOCX document for retrieval."""
    # --- Validate file type -------------------------------------------------
    raw_suffix = (file.filename or "").rsplit(".", 1)[-1].lower()
    if raw_suffix not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415, detail="Only PDF and DOCX files are supported."
        )
    suffix = ALLOWED_TYPES[raw_suffix]

    # --- Validate Content-Type header if provided ----------------------------
    if file.content_type and file.content_type not in (
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/octet-stream",
        "",
    ):
        raise HTTPException(
            status_code=415,
            detail=f"Unexpected content type: {file.content_type}",
        )

    # --- Read and size-check the upload -------------------------------------
    max_bytes = settings.upload_max_mb * 1024 * 1024
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=422, detail="The uploaded file is empty.")
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.upload_max_mb} MB.",
        )

    # --- Extract -> chunk -> embed -------------------------------------------
    pages = extract_pages(file_bytes, suffix)
    chunks = chunk_pages(pages)
    if not chunks:
        raise HTTPException(status_code=422, detail="No text could be extracted.")
    vectors = embed_texts([c.content for c in chunks])

    # --- Persist the original file to the uploads directory --------------------
    uploads_dir = Path(settings.uploads_dir)
    uploads_dir.mkdir(parents=True, exist_ok=True)
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", file.filename or f"upload.{suffix}")
    stored_path = uploads_dir / f"{uuid.uuid4().hex[:8]}_{safe_name}"
    stored_path.write_bytes(file_bytes)

    # --- Persist metadata + chunks in a single transaction ---------------------
    document = Document(
        file_name=file.filename or f"upload.{suffix}",
        file_path=str(stored_path),
        file_type=suffix,
        file_size=len(file_bytes),
        num_pages=len(pages),
        num_chunks=len(chunks),
        created_at=datetime.now(),
    )
    db.add(document)
    try:
        db.flush()  # assign document.id before inserting chunks
        for chunk, vector in zip(chunks, vectors):
            db.add(
                DocumentChunk(
                    document_id=document.id,
                    content=chunk.content,
                    page_number=chunk.page_number,
                    chunk_index=chunk.chunk_index,
                    embedding=vector,
                )
            )
        db.commit()
    except Exception:
        db.rollback()  # never leave partial documents/chunks behind
        stored_path.unlink(missing_ok=True)  # nor an orphaned file on disk
        raise
    db.refresh(document)

    return UploadDocResponse(
        document_id=document.id,
        file_name=document.file_name,
        file_type=document.file_type,
        pages=document.num_pages,
        chunks_stored=document.num_chunks,
        embedding_provider=get_provider(),
    )


@router.post("/ask-rag", response_model=AskRagResponse)
@limiter.limit("30/minute")
def ask_rag(request: Request, payload: AskRagRequest, db: Session = Depends(get_db)):
    """Answer a question using similarity search over indexed documents."""
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question must not be empty.")

    top_k = payload.top_k or settings.rag_top_k

    # --- Vectorize the question ------------------------------------------------
    query_vector = embed_query(question)

    # --- Similarity search: native pgvector, or Python ranking fallback --------
    if vector_support.is_enabled():
        stmt = (
            select(DocumentChunk, Document, DocumentChunk.embedding.cosine_distance(query_vector))
            .join(Document, DocumentChunk.document_id == Document.id)
            .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
            .limit(top_k)
        )
        if payload.document_id is not None:
            stmt = stmt.where(DocumentChunk.document_id == payload.document_id)
        rows = db.execute(stmt).all()
    else:
        rows = vector_support.cosine_rank(db, query_vector, top_k, payload.document_id)
    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No documents are indexed yet. Upload a PDF or DOCX first.",
        )

    # --- Build grounded context (per chunk, for LLM citations) -----------------
    contexts: list[tuple[str, str]] = []
    for chunk, document, distance in rows:
        label = (
            f"{document.file_name}, page {chunk.page_number}"
            if chunk.page_number is not None
            else document.file_name
        )
        contexts.append((label, chunk.content))

    # --- Deduplicate sources: one entry per unique document --------------------
    # Multiple chunks from the same file are merged: page numbers collected,
    # best + average similarity computed, chunk count reported.
    grouped: dict[int, dict] = {}
    for _chunk, document, distance in rows:
        similarity = 1.0 - float(distance)
        entry = grouped.setdefault(
            document.id,
            {"file_name": document.file_name, "pages": [], "sims": []},
        )
        page = _chunk.page_number
        if page is not None and page not in entry["pages"]:
            entry["pages"].append(page)
        entry["sims"].append(similarity)

    sources = sorted(
        (
            RagSource(
                document_id=doc_id,
                file_name=g["file_name"],
                page_numbers=sorted(g["pages"]),
                best_similarity=round(max(g["sims"]), 4),
                avg_similarity=round(sum(g["sims"]) / len(g["sims"]), 4),
                chunk_count=len(g["sims"]),
            )
            for doc_id, g in grouped.items()
        ),
        key=lambda s: s.best_similarity,
        reverse=True,
    )

    answer, answer_source = generate_answer(question, contexts)

    # --- Record the interaction for the Activity Log screen --------------------
    db.add(
        QueryHistory(
            question=question,
            answer=answer,
            answer_source=answer_source,
            document_id=payload.document_id,
            sources=[s.model_dump() for s in sources],
            created_at=datetime.now(),
        )
    )
    db.commit()

    return AskRagResponse(
        question=question, answer=answer, answer_source=answer_source, sources=sources
    )


@router.get("/documents", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db)):
    """List all indexed documents."""
    return db.scalars(select(Document).order_by(Document.created_at.desc())).all()


@router.get("/documents/{document_id}/download")
def download_document(document_id: int, db: Session = Depends(get_db)):
    """Download the original uploaded file from the uploads directory."""
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if not document.file_path:
        raise HTTPException(status_code=410, detail="Original file is no longer stored.")

    path = Path(document.file_path)
    uploads_root = Path(settings.uploads_dir).resolve()

    # Path traversal protection: resolved path must be inside uploads_dir
    if not path.resolve().is_relative_to(uploads_root):
        raise HTTPException(status_code=400, detail="Invalid file path")
    if not path.exists():
        raise HTTPException(status_code=410, detail="Original file is no longer stored.")

    return FileResponse(path, filename=document.file_name)


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Delete a document, its chunks (cascade) and the stored file on disk."""
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    file_path = Path(document.file_path) if document.file_path else None
    db.delete(document)
    db.commit()
    if file_path is not None:
        file_path.unlink(missing_ok=True)


@router.post("/documents/{document_id}/ask", response_model=AskRagResponse)
@limiter.limit("30/minute")
def ask_document(request: Request, document_id: int, payload: AskRagRequest, db: Session = Depends(get_db)):
    """Answer a question scoped to a single document."""
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question must not be empty.")

    top_k = payload.top_k or settings.rag_top_k
    query_vector = embed_query(question)

    if vector_support.is_enabled():
        stmt = (
            select(DocumentChunk, Document, DocumentChunk.embedding.cosine_distance(query_vector))
            .join(Document, DocumentChunk.document_id == Document.id)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
            .limit(top_k)
        )
        rows = db.execute(stmt).all()
    else:
        rows = vector_support.cosine_rank(db, query_vector, top_k, document_id)

    if not rows:
        raise HTTPException(status_code=422, detail="This document has no indexed content yet")

    contexts = [(document.file_name, c.content) for c, _, _ in rows]

    grouped: dict[int, dict] = {}
    for chunk, doc, distance in rows:
        similarity = 1.0 - float(distance)
        entry = grouped.setdefault(
            doc.id,
            {"file_name": doc.file_name, "pages": [], "sims": []},
        )
        if chunk.page_number is not None and chunk.page_number not in entry["pages"]:
            entry["pages"].append(chunk.page_number)
        entry["sims"].append(similarity)

    sources = sorted(
        (
            RagSource(
                document_id=doc_id,
                file_name=g["file_name"],
                page_numbers=sorted(g["pages"]),
                best_similarity=round(max(g["sims"]), 4),
                avg_similarity=round(sum(g["sims"]) / len(g["sims"]), 4),
                chunk_count=len(g["sims"]),
            )
            for doc_id, g in grouped.items()
        ),
        key=lambda s: s.best_similarity,
        reverse=True,
    )

    answer, answer_source = generate_answer(question, contexts)
    return AskRagResponse(question=question, answer=answer, answer_source=answer_source, sources=sources)
