"""Runtime detection of pgvector availability on the PostgreSQL server.

The RAG pipeline prefers native pgvector similarity search. When the
extension is not installed, the system degrades gracefully: embeddings are
stored as JSONB and cosine ranking happens in Python (fine for small/medium
corpora). As soon as the extension is installed and the app restarts, the
same column becomes a real `vector` column with indexed SQL-side search.
"""

import logging

from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger("lectureiq.rag")

_state: bool = False


def detect_and_enable(engine) -> bool:
    """Try to enable the vector extension; record whether it succeeded."""
    global _state
    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        _state = True
        logger.info("pgvector extension enabled - native vector search active.")
    except Exception:
        _state = False
        logger.warning(
            "pgvector extension NOT available - falling back to JSONB storage "
            "with in-Python cosine ranking. Install pgvector and restart to "
            "enable native SQL vector search."
        )
    return _state


def is_enabled() -> bool:
    return _state


def adapt_chunk_column(model, dims: int) -> None:
    """Finalize the embedding column type before create_all.

    - pgvector available  -> `Vector(dims)` for native SQL similarity search
    - pgvector missing    -> JSONB (in-Python cosine ranking fallback)
    """
    if _state:
        from pgvector.sqlalchemy import Vector

        model.__table__.c.embedding.type = Vector(dims)
    # else: keep the JSONB placeholder defined on the model


def cosine_rank(
    db: Session,
    query_vector: list[float],
    top_k: int,
    document_id: int | None = None,
):
    """Python-side cosine ranking used in degraded (no-pgvector) mode.

    Returns rows of (DocumentChunk, Document, distance) mirroring the SQL path.
    """
    import math

    from sqlalchemy import select

    from app.models import Document, DocumentChunk

    def _cosine(a, b) -> float:
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a))
        nb = math.sqrt(sum(y * y for y in b))
        if na == 0 or nb == 0:
            return 1.0
        return 1.0 - dot / (na * nb)

    stmt = select(DocumentChunk).join(Document, DocumentChunk.document_id == Document.id)
    if document_id is not None:
        stmt = stmt.where(DocumentChunk.document_id == document_id)
    chunks = db.scalars(stmt).all()

    scored = []
    for chunk in chunks:
        vec = [float(x) for x in chunk.embedding]
        scored.append((chunk, chunk.document, _cosine(query_vector, vec)))
    scored.sort(key=lambda row: row[2])
    return scored[:top_k]
