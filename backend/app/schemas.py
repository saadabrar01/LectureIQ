from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TranscriptSegmentOut(ORMModel):
    start: int
    text: str


class LectureCreate(BaseModel):
    id: str | None = None
    title: str
    channel: str
    video_id: str
    url: str
    duration: int = 0
    status: str = "queued"
    progress: int = 0
    thumbnail: str = ""


class LectureOut(ORMModel):
    id: str
    title: str
    channel: str
    video_id: str
    url: str
    duration: int
    added_at: datetime
    status: str
    progress: int
    thumbnail: str


class LectureDetailOut(LectureOut):
    transcript: list[TranscriptSegmentOut]


class ChatMessageCreate(BaseModel):
    lecture_id: str | None = None
    role: str = "user"
    text: str
    citations: list[dict] | None = None
    saved: bool = False


class ChatMessageOut(ORMModel):
    id: str
    lecture_id: str | None
    role: str
    text: str
    timestamp: datetime
    citations: list[dict] | None
    saved: bool


class NoteCreate(BaseModel):
    id: str | None = None
    title: str
    content: str
    lecture_id: str | None = None
    color: str = "#8EF0A3"


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    lecture_id: str | None = None
    color: str | None = None


class NoteOut(ORMModel):
    id: str
    title: str
    content: str
    lecture_id: str | None
    lecture_title: str | None
    color: str
    updated_at: datetime


class BookmarkCreate(BaseModel):
    id: str | None = None
    lecture_id: str
    quote: str


class BookmarkOut(ORMModel):
    id: str
    lecture_id: str
    lecture_title: str
    quote: str
    created_at: datetime


class QuizQuestionOut(ORMModel):
    id: str
    question: str
    options: list[str]
    correct_index: int
    explanation: str
    source_time: int


class StatsOut(BaseModel):
    videos_processed: int
    questions_asked: int
    streak: int
    minutes_watched: int


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(ORMModel):
    id: int
    email: str
    name: str
    avatar: str
    join_date: str
    videos_processed: int
    questions_asked: int
    streak: int
    minutes_watched: int


# --- RAG schemas -----------------------------------------------------------


class UploadDocResponse(BaseModel):
    document_id: int
    file_name: str
    file_type: str
    pages: int
    chunks_stored: int
    embedding_provider: str


class AskRagRequest(BaseModel):
    question: str
    top_k: int | None = None  # override settings.rag_top_k per request
    document_id: int | None = None  # restrict search to one document


class RagSource(BaseModel):
    """A deduplicated source: one entry per unique document.

    Multiple retrieved chunks from the same file are merged - page numbers
    are collected, and both the best and average similarity are reported.
    """

    document_id: int
    file_name: str
    page_numbers: list[int]
    best_similarity: float
    avg_similarity: float
    chunk_count: int


class AskRagResponse(BaseModel):
    question: str
    answer: str
    answer_source: str  # llm | extractive-fallback | no-context
    sources: list[RagSource]


class DocumentOut(ORMModel):
    id: int
    file_name: str
    file_path: str
    file_type: str
    file_size: int
    num_pages: int
    num_chunks: int
    created_at: datetime


class HistoryOut(ORMModel):
    """A recorded RAG interaction shown on the Activity Log screen."""

    id: int
    question: str
    answer: str
    answer_source: str
    document_id: int | None
    sources: list[dict] | None
    created_at: datetime
