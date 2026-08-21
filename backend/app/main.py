from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import Base, engine
from app.routers import auth, bookmarks, chat, documents, health, history, lectures, notes, stats


@asynccontextmanager
async def lifespan(_: FastAPI):
    # 1. Detect pgvector; degrade gracefully to JSONB + Python ranking if missing.
    from app.db import vector_support
    from app.models import DocumentChunk
    from app.services.embeddings import init_embeddings

    vector_support.detect_and_enable(engine)

    # 2. Resolve the embedding provider (openai -> fastembed -> hashing) so the
    #    vector column is created with the correct dimensionality.
    provider, dims = init_embeddings()
    logging.getLogger("lectureiq.rag").info(
        "Embeddings: provider=%s dims=%d | pgvector=%s",
        provider,
        dims,
        vector_support.is_enabled(),
    )
    vector_support.adapt_chunk_column(DocumentChunk, dims)

    # 3. Dev convenience: create tables on startup (use Alembic for production)
    Base.metadata.create_all(bind=engine)

    # 4. Tiny dev auto-migrations for columns added after first release.
    with engine.begin() as conn:
        conn.execute(
            sa_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_path VARCHAR(1024)")
        )
    yield


app = FastAPI(title="LectureIQ API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(lectures.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(bookmarks.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(history.router, prefix="/api")
