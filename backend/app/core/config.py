import socket
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://postgres:postgres@localhost:5432/lecture_iq"
    cors_origins: str = "http://localhost:8081,http://localhost:19006"

    # --- Security settings --------------------------------------------------
    jwt_secret: str = "CHANGE-ME-IN-PRODUCTION-use-openssl-rand-hex-32"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

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
        # Explicit allowlist from env, plus dynamic origins for every trusted
        # host (localhost / loopback / Android emulator / this machine's LAN IPs)
        # across the common dev-server port range. This removes the "OPTIONS 400"
        # preflight failures that happen whenever the frontend serves on a port
        # not hard-coded into CORS_ORIGINS (e.g. 8082 when 8081 is already taken).
        explicit = [o.strip() for o in self.cors_origins.split(",") if o.strip()]

        hosts = {"localhost", "127.0.0.1", "10.0.2.2"}
        try:
            hosts.update(self._lan_ips())
        except Exception:
            pass

        dynamic: list[str] = []
        for ip in sorted(hosts):
            # Common Expo / dev ports plus the fallback port shift.
            for port in list(range(8000, 8100)) + [19000, 19001, 19002, 19006]:
                dynamic.append(f"http://{ip}:{port}")
                dynamic.append(f"exp://{ip}:{port}")

        seen = set()
        result: list[str] = []
        for origin in explicit + dynamic:
            if origin not in seen:
                seen.add(origin)
                result.append(origin)
        return result

    @staticmethod
    def _lan_ips() -> set[str]:
        ips: set[str] = set()
        try:
            hostname = socket.gethostname()
            for info in socket.getaddrinfo(hostname, None):
                ip = info[4][0]
                if ip and not ip.startswith("127.") and ":" not in ip:
                    ips.add(ip)
        except Exception:
            pass
        return ips


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
