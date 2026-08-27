from contextlib import asynccontextmanager
import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import text

from app.core.config import settings
from app.db.session import Base, engine
from app.routers import auth, bookmarks, chat, documents, health, history, lectures, notes, stats

# --- Rate limiter -----------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # 1. Detect pgvector; degrade gracefully to JSONB + Python ranking if missing.
    from app.db import vector_support
    from app.models import DocumentChunk
    from app.services.embeddings import init_embeddings

    vector_support.detect_and_enable(engine)

    # 2. Resolve embedding provider
    provider, dims = init_embeddings()
    logging.getLogger("lectureiq.rag").info(
        "Embeddings: provider=%s dims=%d | pgvector=%s",
        provider,
        dims,
        vector_support.is_enabled(),
    )
    vector_support.adapt_chunk_column(DocumentChunk, dims)

    # 3. Create tables on startup
    Base.metadata.create_all(bind=engine)

    # 4. Auto-migrations for user & document columns
    with engine.begin() as conn:
        conn.execute(
            text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_path VARCHAR(1024)")
        )
        conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255)")
        )
        conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT")
        )
        conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT")
        )
        conn.execute(text(
            "CREATE TABLE IF NOT EXISTS lecture_chunks ("
            "id SERIAL PRIMARY KEY, "
            "lecture_id VARCHAR(32) NOT NULL REFERENCES lectures(id) ON DELETE CASCADE, "
            "chunk_text TEXT NOT NULL, "
            "embedding JSONB, "
            "timestamp_sec INTEGER, "
            "chunk_index INTEGER NOT NULL, "
            "created_at TIMESTAMPTZ DEFAULT now()"
            ")"
        ))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_lecture_chunks_lecture_id "
            "ON lecture_chunks (lecture_id)"
        ))
        conn.execute(text("ALTER TABLE lectures ADD COLUMN IF NOT EXISTS duration_sec INTEGER"))
    yield


app = FastAPI(title="LectureIQ API", version="1.0.0", lifespan=lifespan)

# --- Rate limiting ----------------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Global request size limits ---------------------------------------------
MAX_UPLOAD_BYTES = 1024 * 1024 * 1024  # 1 GB for videos & large documents
MAX_JSON_BYTES = 20 * 1024 * 1024      # 20 MB for JSON / regular requests


@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length:
        size = int(content_length)
        is_upload = any(request.url.path.startswith(p) for p in ["/api/lectures/upload-video", "/api/upload-doc", "/api/auth/upload-avatar"])
        limit = MAX_UPLOAD_BYTES if is_upload else MAX_JSON_BYTES
        if size > limit:
            return JSONResponse(
                status_code=413,
                content={"detail": f"Request body too large. Maximum allowed size is {limit // (1024 * 1024)} MB."},
            )
    return await call_next(request)


# --- Static uploads (served without auth for dev convenience) ----------------
uploads_dir = Path(settings.uploads_dir)
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# --- CORS -------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# --- Routers ----------------------------------------------------------------
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(lectures.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(bookmarks.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(history.router, prefix="/api")
