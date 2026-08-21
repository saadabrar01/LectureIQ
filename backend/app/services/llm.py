"""Answer generation for the RAG pipeline.

The LLM provider is configurable (Groq or OpenAI - both expose an
OpenAI-compatible chat completions API). When no provider key is set, a
transparent extractive fallback returns the most relevant sentences from
the retrieved context, clearly labeled as such, so the endpoint always
produces a useful, source-backed response.
"""

import httpx
from fastapi import HTTPException

from app.core.config import settings

_SYSTEM_PROMPT = (
    "You are LectureIQ's study assistant. Answer the user's question using ONLY "
    "the provided document context. Cite sources inline as [file name, page N] "
    "where N is the page number. If the context does not contain enough "
    "information to answer, say so explicitly - never invent facts."
)


def _llm_endpoint() -> tuple[str, str] | None:
    """Return (chat_completions_url, api_key) for the configured provider."""
    if settings.llm_provider == "groq" and settings.groq_api_key:
        return f"{settings.groq_base_url}/chat/completions", settings.groq_api_key
    if settings.llm_provider == "openai" and settings.openai_api_key:
        return f"{settings.openai_base_url}/chat/completions", settings.openai_api_key
    return None


def generate_answer(question: str, contexts: list[tuple[str, str]]) -> tuple[str, str]:
    """Generate an answer for `question` given (label, text) contexts.

    Returns (answer, answer_source) where answer_source is "llm" or
    "extractive-fallback".
    """
    if not contexts:
        return (
            "I could not find any relevant content in your documents. Please upload "
            "a PDF or DOCX first, or rephrase your question.",
            "no-context",
        )
    endpoint = _llm_endpoint()
    if endpoint:
        return _generate_llm(question, contexts, *endpoint), "llm"
    return _extractive_answer(question, contexts), "extractive-fallback"


def _build_context_block(contexts: list[tuple[str, str]]) -> str:
    """Format retrieved chunks with their source labels."""
    return "\n\n---\n\n".join(
        f"[Source: {label}]\n{text}" for label, text in contexts
    )


def _generate_llm(
    question: str, contexts: list[tuple[str, str]], url: str, api_key: str
) -> str:
    """Call the provider's OpenAI-compatible chat completions API."""
    try:
        response = httpx.post(
            url,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": settings.chat_model,
                "temperature": settings.llm_temperature,
                "messages": [
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            f"Document context:\n\n{_build_context_block(contexts)}\n\n"
                            f"Question: {question}"
                        ),
                    },
                ],
            },
            timeout=90,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI chat request failed: {exc.response.text[:300]}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502, detail=f"Could not reach the OpenAI API: {exc}"
        ) from exc


def _extractive_answer(question: str, contexts: list[tuple[str, str]]) -> str:
    """Fallback: rank sentences by overlap with question keywords."""
    keywords = {
        w for w in "".join(c if c.isalnum() else " " for c in question.lower()).split()
        if len(w) >= 3
    }
    scored: list[tuple[int, str, str]] = []  # (score, label, sentence)
    for label, text in contexts:
        for sentence in text.replace("! ", ".\n").replace("? ", ".\n").split(". "):
            sentence = sentence.strip()
            if len(sentence) < 25:
                continue
            words = set(sentence.lower().split())
            score = sum(1 for kw in keywords if kw in words)
            if score > 0:
                scored.append((score, label, sentence))

    scored.sort(key=lambda item: item[0], reverse=True)
    top = scored[:4]
    if not top:
        # No keyword overlap at all - surface the best chunk verbatim.
        label, text = contexts[0]
        return f"[No direct match found - closest excerpt]\n\n[{label}]\n{text[:600]}"
    lines = [f"- {sentence} [{label}]" for _, label, sentence in top]
    return "(Extractive fallback - set OPENAI_API_KEY for full LLM answers)\n\n" + "\n".join(lines)
