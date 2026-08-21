"""Text extraction for uploaded PDF and DOCX files.

Every extractor returns a list of (page_number, text) tuples so that page
level metadata can be stored alongside each chunk. DOCX files have no real
page boundaries, so the whole document is returned with page_number=None.
"""

from io import BytesIO

from fastapi import HTTPException


def extract_pages(file_bytes: bytes, file_type: str) -> list[tuple[int | None, str]]:
    """Dispatch to the correct extractor based on the file type."""
    if file_type == "pdf":
        return _extract_pdf(file_bytes)
    if file_type == "docx":
        return _extract_docx(file_bytes)
    raise HTTPException(status_code=415, detail=f"Unsupported file type: {file_type}")


def _extract_pdf(file_bytes: bytes) -> list[tuple[int | None, str]]:
    """Extract text page by page using pypdf (1-based page numbers)."""
    try:
        from pypdf import PdfReader
    except ImportError as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail="pypdf is not installed") from exc

    try:
        reader = PdfReader(BytesIO(file_bytes))
        pages = [
            (number, page.extract_text() or "")
            for number, page in enumerate(reader.pages, start=1)
        ]
    except Exception as exc:
        raise HTTPException(
            status_code=422, detail="Could not read the PDF file. It may be corrupted or encrypted."
        ) from exc

    if not any(text.strip() for _, text in pages):
        raise HTTPException(
            status_code=422,
            detail="No extractable text found in the PDF (it may be a scanned image).",
        )
    return pages


def _extract_docx(file_bytes: bytes) -> list[tuple[int | None, str]]:
    """Extract paragraph text from a Word document using python-docx."""
    try:
        from docx import Document as DocxDocument
    except ImportError as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail="python-docx is not installed") from exc

    try:
        docx_file = DocxDocument(BytesIO(file_bytes))
        paragraphs = [p.text.strip() for p in docx_file.paragraphs if p.text.strip()]
    except Exception as exc:
        raise HTTPException(
            status_code=422, detail="Could not read the DOCX file. It may be corrupted."
        ) from exc

    if not paragraphs:
        raise HTTPException(status_code=422, detail="No extractable text found in the DOCX.")
    return [(None, "\n\n".join(paragraphs))]
