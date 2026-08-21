"""Chunking of extracted page text into embedding-sized pieces.

Strategy: a sliding character window with word-boundary snapping, applied
per page so every chunk keeps an exact `page_number` reference.
"""

import re
from dataclasses import dataclass

from app.core.config import settings


@dataclass
class Chunk:
    content: str
    page_number: int | None
    chunk_index: int


def chunk_pages(
    pages: list[tuple[int | None, str]],
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[Chunk]:
    """Split each page's text into overlapping chunks.

    Args:
        pages: (page_number, text) tuples as produced by the extractors.
        chunk_size: target maximum characters per chunk (default from settings).
        chunk_overlap: characters shared between consecutive chunks (default from settings).
    """
    size = chunk_size or settings.rag_chunk_size
    overlap = chunk_overlap if chunk_overlap is not None else settings.rag_chunk_overlap
    step = max(size - overlap, 1)

    chunks: list[Chunk] = []
    index = 0
    for page_number, raw_text in pages:
        # Normalize whitespace but keep paragraph breaks readable.
        text = re.sub(r"[ \t]+", " ", raw_text).strip()
        if not text:
            continue

        start = 0
        while start < len(text):
            end = min(start + size, len(text))
            # Snap the window edge to a word boundary to avoid cutting words.
            if end < len(text):
                last_space = text.rfind(" ", start, end)
                if last_space > start:
                    end = last_space
            piece = text[start:end].strip()
            if piece:
                chunks.append(Chunk(content=piece, page_number=page_number, chunk_index=index))
                index += 1
            start += step if end < len(text) else end - start
    return chunks
