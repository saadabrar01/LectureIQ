from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://postgres:postgres@localhost:5432/lecture_iq"
    cors_origins: str = "*"

    # --- RAG / AI settings -------------------------------------------------
    # LLM provider for answer generation: "groq" or "openai".
    llm_provider: str = "groq"
    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"
    openai_base_url: str = "https://api.openai.com/v1"

    # Embedding provider resolution order (when "auto"):
    #   1. openai    - if OPENAI_API_KEY is set (semantic, 1536 dims)
    #   2. fastembed - local ONNX BGE model (semantic, 384 dims, offline)
    #   3. hashing   - last-resort lexical fallback
    embedding_provider: str = "auto"  # auto | openai | fastembed | hashing
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536  # used by openai/hashing; fastembed uses its model's dims

    chat_model: str = "openai/gpt-oss-120b"  # Groq model; use gpt-4o-mini for OpenAI
    llm_temperature: float = 0.2

    # Smaller chunks with healthy overlap improve retrieval precision for QA.
    rag_chunk_size: int = 800         # max characters per chunk
    rag_chunk_overlap: int = 180      # character overlap between consecutive chunks
    rag_top_k: int = 6                # chunks retrieved per query
    upload_max_mb: int = 20           # reject uploads larger than this
    uploads_dir: str = "uploads"      # where original files are stored on disk

    @property
    def sqlalchemy_database_url(self) -> str:
        # Accept the plain postgresql:// scheme and route it through psycopg 3
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace(
                "postgresql://", "postgresql+psycopg://", 1
            )
        return self.database_url

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
