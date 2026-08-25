from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import vector_support
from app.db.session import get_db
from app.models import Lecture, LectureChunk, QuizQuestion, TranscriptSegment
from app.schemas import (
    LectureAskRequest,
    LectureAskResponse,
    LectureCitation,
    LectureCreate,
    LectureDetailOut,
    LectureOut,
    QuizQuestionOut,
    YouTubeImportRequest,
)
from app.services.embeddings import embed_query, embed_texts
from app.services.llm import generate_answer
from app.services.video_service import (
    chunk_transcript_segments,
    extract_youtube_id,
    get_youtube_metadata,
    get_youtube_transcript,
)

router = APIRouter(prefix="/lectures", tags=["lectures"])
limiter = Limiter(key_func=get_remote_address)


@router.get("", response_model=list[LectureOut])
def list_lectures(db: Session = Depends(get_db)):
    return db.scalars(select(Lecture).order_by(Lecture.added_at.desc())).all()


@router.post("", response_model=LectureOut, status_code=201)
def create_lecture(payload: LectureCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()
    data["id"] = data["id"] or uuid4().hex[:12]
    if not data["thumbnail"]:
        data["thumbnail"] = f"https://img.youtube.com/vi/{data['video_id']}/hqdefault.jpg"
    lecture = Lecture(**data, added_at=datetime.now())
    db.add(lecture)
    db.commit()
    db.refresh(lecture)
    return lecture


@router.get("/{lecture_id}", response_model=LectureDetailOut)
def get_lecture(lecture_id: str, db: Session = Depends(get_db)):
    lecture = db.get(Lecture, lecture_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture


@router.delete("/{lecture_id}", status_code=204)
def delete_lecture(lecture_id: str, db: Session = Depends(get_db)):
    lecture = db.get(Lecture, lecture_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    db.delete(lecture)
    db.commit()


@router.get("/{lecture_id}/quiz", response_model=list[QuizQuestionOut])
def list_quiz(lecture_id: str, db: Session = Depends(get_db)):
    if not db.get(Lecture, lecture_id):
        raise HTTPException(status_code=404, detail="Lecture not found")
    return db.scalars(
        select(QuizQuestion).where(QuizQuestion.lecture_id == lecture_id)
    ).all()


TOP_K = 6


@router.post("/{lecture_id}/ask", response_model=LectureAskResponse)
@limiter.limit("30/minute")
def ask_lecture(request: Request, lecture_id: str, payload: LectureAskRequest, db: Session = Depends(get_db)):
    """Answer a question scoped to a lecture's transcript chunks."""
    lecture = db.get(Lecture, lecture_id)
    if lecture is None:
        raise HTTPException(status_code=404, detail="Lecture not found")

    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question must not be empty.")

    query_vector = embed_query(question)

    if vector_support.is_enabled():
        stmt = (
            select(LectureChunk, LectureChunk.embedding.cosine_distance(query_vector))
            .where(LectureChunk.lecture_id == lecture_id)
            .order_by(LectureChunk.embedding.cosine_distance(query_vector))
            .limit(TOP_K)
        )
        rows = db.execute(stmt).all()
    else:
        import math

        chunks = db.scalars(
            select(LectureChunk).where(LectureChunk.lecture_id == lecture_id)
        ).all()
        scored = []
        for chunk in chunks:
            vec = [float(x) for x in chunk.embedding]
            dot = sum(x * y for x, y in zip(query_vector, vec))
            na = math.sqrt(sum(x * x for x in query_vector))
            nb = math.sqrt(sum(y * y for y in vec))
            dist = 1.0 - dot / (na * nb) if na and nb else 1.0
            scored.append((chunk, dist))
        scored.sort(key=lambda r: r[1])
        rows = scored[:TOP_K]

    if not rows:
        raise HTTPException(status_code=422, detail="This lecture has no indexed transcript yet")

    contexts = []
    citations = []
    for item in rows:
        if isinstance(item, tuple):
            chunk, distance = item
        else:
            chunk, distance = item[0], item[1]
        contexts.append((lecture.title, chunk.chunk_text))
        sim = round(1.0 - float(distance), 4)
        citations.append(
            LectureCitation(
                snippet=chunk.chunk_text[:200],
                timestamp_sec=chunk.timestamp_sec,
                similarity=sim,
            )
        )

    answer, _answer_source = generate_answer(question, contexts)
    return LectureAskResponse(answer=answer, citations=citations)


@router.post("/youtube", response_model=LectureOut, status_code=201)
@limiter.limit("10/hour")
def import_youtube_lecture(request: Request, payload: YouTubeImportRequest, db: Session = Depends(get_db)):
    """Import a YouTube video URL, fetch transcript, chunk & embed into vector DB."""
    try:
        video_id = extract_youtube_id(payload.url)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))

    # Check if lecture with video_id already exists
    existing = db.scalar(select(Lecture).where(Lecture.video_id == video_id))
    if existing:
        return existing

    # Fetch YouTube metadata
    meta = get_youtube_metadata(video_id)
    lecture_id = uuid4().hex[:12]

    lecture = Lecture(
        id=lecture_id,
        title=meta["title"],
        channel=meta["channel"],
        video_id=video_id,
        url=meta["url"],
        duration=meta["duration"],
        added_at=datetime.now(),
        status="processing",
        progress=10,
        thumbnail=meta["thumbnail"],
    )
    db.add(lecture)
    db.commit()
    db.refresh(lecture)

    # 1. Extract transcript segments
    raw_segments = get_youtube_transcript(video_id)

    # Store TranscriptSegments in DB
    ts_models = [
        TranscriptSegment(lecture_id=lecture_id, start=seg["start"], text=seg["text"])
        for seg in raw_segments
    ]
    db.add_all(ts_models)
    lecture.progress = 50
    db.commit()

    # 2. Chunk transcript with timestamps
    chunks_data = chunk_transcript_segments(raw_segments)
    if chunks_data:
        chunk_texts = [c["chunk_text"] for c in chunks_data]
        embeddings = embed_texts(chunk_texts)

        chunk_models = []
        for cdata, emb in zip(chunks_data, embeddings):
            chunk_models.append(
                LectureChunk(
                    lecture_id=lecture_id,
                    chunk_text=cdata["chunk_text"],
                    embedding=emb,
                    timestamp_sec=cdata["timestamp_sec"],
                    chunk_index=cdata["chunk_index"],
                )
            )
        db.add_all(chunk_models)

    lecture.status = "ready"
    lecture.progress = 100
    db.commit()
    db.refresh(lecture)
    return lecture
