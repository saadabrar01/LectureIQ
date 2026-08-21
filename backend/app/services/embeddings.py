"""Embedding generation with automatic provider selection.

Resolution order (config `EMBEDDING_PROVIDER=auto`):
  1. openai    - OpenAI API embeddings when OPENAI_API_KEY is set.
  2. fastembed - local ONNX BGE model (BAAI/bge-small-en-v1.5, 384 dims).
                 Fully offline, CPU-friendly, and semantically strong -
                 this is the default workhorse for this project.
  3. hashing   - deterministic feature-hashing fallback (lexical
                 similarity) used only if fastembed is not installed.

`init_embeddings()` must be called once at app startup so the resolved
provider and vector dimensionality are known before tables are created.
"""

import hashlib
import math
import threading

import httpx
from fastapi import HTTPException

from app.core.config import settings

_FASTEMBED_MODEL = "BAAI/bge-small-en-v1.5"
_BATCH_SIZE = 64  # max texts per API/model call

_lock = threading.Lock()
_state: dict = {"provider": None, "dims": None, "_model": None}


def init_embeddings() -> tuple[str, int]:
    """Resolve the embedding provider and its vector dimensionality.

    Called from the app lifespan BEFORE create_all so the pgvector column
    is created with the correct dimension. Returns (provider, dims).
    """
    with _lock:
        if _state["provider"] is not None:  # already initialized
            return _state["provider"], _state["dims"]

        provider = settings.embedding_provider
        if provider == "openai" and settings.openai_api_key:
            _state["provider"] = "openai"
            _state["dims"] = settings.embedding_dimensions or 1536
        elif provider in ("auto", "fastembed"):
            try:
                import fastembed  # noqa: F401 - availability probe

                _state["provider"] = "fastembed"
                _state["dims"] = _fastembed_dims()
            except ImportError:
                _state["provider"] = "hashing"
                _state["dims"] = settings.embedding_dimensions or 1536
        else:  # explicit "hashing" or misconfiguration
            _state["provider"] = "hashing"
            _state["dims"] = settings.embedding_dimensions or 1536

        return _state["provider"], _state["dims"]


def get_provider() -> str:
    return _state["provider"] or "uninitialized"


def get_dims() -> int:
    return _state["dims"] or settings.embedding_dimensions


def _fastembed_dims() -> int:
    """Dimensionality of the local BGE model (384 for bge-small-en-v1.5)."""
    return 384


def _get_model():
    """Lazily load (and cache) the local fastembed model."""
    if _state["_model"] is None:
        from fastembed import TextEmbedding

        _state["_model"] = TextEmbedding(_FASTEMBED_MODEL)
    return _state["_model"]


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed document passages with the active provider."""
    if not texts:
        return []
    provider = _state["provider"]
    if provider == "openai":
        return _embed_openai(texts)
    if provider == "fastembed":
        return _embed_fastembed(texts, is_query=False)
    return _embed_hashing(texts)


def embed_query(text: str) -> list[float]:
    """Embed a user question with the active provider.

    fastembed's query_embed applies the retrieval instruction prefix that
    BGE models expect, which measurably improves ranking quality.
    """
    provider = _state["provider"]
    if provider == "openai":
        return _embed_openai([text])[0]
    if provider == "fastembed":
        return _embed_fastembed([text], is_query=True)[0]
    return _embed_hashing([text])[0]


# --- Providers --------------------------------------------------------------


def _embed_openai(texts: list[str]) -> list[list[float]]:
    """Call the OpenAI /v1/embeddings endpoint in batches."""
    all_vectors: list[list[float]] = []
    try:
        for start in range(0, len(texts), _BATCH_SIZE):
            batch = texts[start : start + _BATCH_SIZE]
            response = httpx.post(
                f"{settings.openai_base_url}/embeddings",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={"model": settings.embedding_model, "input": batch},
                timeout=60,
            )
            response.raise_for_status()
            data = sorted(response.json()["data"], key=lambda item: item["index"])
            all_vectors.extend(item["embedding"] for item in data)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI embedding request failed: {exc.response.text[:300]}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502, detail=f"Could not reach the OpenAI API: {exc}"
        ) from exc
    return all_vectors


def _embed_fastembed(texts: list[str], is_query: bool) -> list[list[float]]:
    """Local semantic embeddings via ONNX (no network, no API key)."""
    try:
        model = _get_model()
        iterator = (
            model.query_embed(texts) if is_query else model.embed(texts)
        )
        return [ [float(x) for x in vec] for vec in iterator ]
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Local embedding failed: {exc}"
        ) from exc


def _tokenize(text: str) -> list[str]:
    """Lowercase word tokens of length >= 2 (numbers included)."""
    return [
        t
        for t in "".join(c if c.isalnum() else " " for c in text.lower()).split()
        if len(t) >= 2
    ]


def _embed_hashing(texts: list[str]) -> list[list[float]]:
    """Feature-hashing embedder: each token hashed to one of `dims` slots.

    Deterministic bag-of-words random projection; L2-normalized so cosine
    distance behaves. Lexical only - kept purely as a last-resort fallback.
    """
    dims = get_dims()
    result: list[list[float]] = []
    for text in texts:
        vec = [0.0] * dims
        for token in _tokenize(text):
            digest = hashlib.blake2b(token.encode(), digest_size=8).digest()
            slot = int.from_bytes(digest[:4], "little") % dims
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            vec[slot] += sign
        norm = math.sqrt(sum(v * v for v in vec))
        result.append([v / norm for v in vec] if norm > 0 else vec)
    return result
