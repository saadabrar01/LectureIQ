import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


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

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title must not be empty.")
        if len(v) > 500:
            raise ValueError("Title is too long (max 500 characters).")
        return v

    @field_validator("video_id")
    @classmethod
    def validate_video_id(cls, v: str) -> str:
        v = v.strip()
        if len(v) > 20:
            raise ValueError("video_id is too long.")
        if not re.match(r"^[A-Za-z0-9_-]+$", v):
            raise ValueError("video_id contains invalid characters.")
        return v

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, v: str) -> str:
        v = v.strip()
        if len(v) > 200:
            raise ValueError("Channel name is too long.")
        return v


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

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message text must not be empty.")
        if len(v) > 10000:
            raise ValueError("Message is too long (max 10000 characters).")
        return v.strip()

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("user", "ai"):
            raise ValueError("role must be 'user' or 'ai'.")
        return v


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

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title must not be empty.")
        if len(v) > 200:
            raise ValueError("Title is too long (max 200 characters).")
        return v

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        if len(v) > 50000:
            raise ValueError("Content is too long (max 50000 characters).")
        return v

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str) -> str:
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("Color must be a valid hex color (e.g. #8EF0A3).")
        return v


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    lecture_id: str | None = None
    color: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Title must not be empty.")
            if len(v) > 200:
                raise ValueError("Title is too long (max 200 characters).")
        return v

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 50000:
            raise ValueError("Content is too long (max 50000 characters).")
        return v

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("Color must be a valid hex color (e.g. #8EF0A3).")
        return v


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

    @field_validator("quote")
    @classmethod
    def validate_quote(cls, v: str) -> str:
        if len(v) > 5000:
            raise ValueError("Quote is too long (max 5000 characters).")
        return v


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

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name must not be empty.")
        if len(v) > 100:
            raise ValueError("Name is too long (max 100 characters).")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Invalid email address.")
        if len(v) > 254:
            raise ValueError("Email is too long.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters.")
        if len(v) > 128:
            raise ValueError("Password is too long (max 128 characters).")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) > 128:
            raise ValueError("Password is too long.")
        return v


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    username: str | None = None
    email: str | None = None
    bio: str | None = None
    avatar_url: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Name must not be empty.")
            if len(v) > 100:
                raise ValueError("Name is too long (max 100 characters).")
        return v

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if v and not re.match(r"^[a-zA-Z0-9._-]{1,50}$", v):
                raise ValueError("Username must be 1-50 alphanumeric characters (dots, dashes, underscores allowed).")
        return v or None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip().lower()
            if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
                raise ValueError("Invalid email address.")
        return v

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 500:
            raise ValueError("Bio is too long (max 500 characters).")
        return v


class UserOut(ORMModel):
    id: int
    email: str
    name: str
    username: str | None = None
    bio: str | None = None
    avatar: str
    avatar_url: str | None = None
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
    top_k: int | None = None
    document_id: int | None = None

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Question must not be empty.")
        if len(v) > 2000:
            raise ValueError("Question is too long (max 2000 characters).")
        return v

    @field_validator("top_k")
    @classmethod
    def validate_top_k(cls, v: int | None) -> int | None:
        if v is not None and (v < 1 or v > 20):
            raise ValueError("top_k must be between 1 and 20.")
        return v


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


# --- Lecture-level RAG schemas ----------------------------------------------


class LectureAskRequest(BaseModel):
    question: str

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Question must not be empty.")
        if len(v) > 2000:
            raise ValueError("Question is too long (max 2000 characters).")
        return v


class LectureCitation(BaseModel):
    snippet: str
    timestamp_sec: int | None = None
    similarity: float | None = None


class LectureAskResponse(BaseModel):
    answer: str
    citations: list[LectureCitation]


class YouTubeImportRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("URL must not be empty.")
        if len(v) > 2048:
            raise ValueError("URL is too long (max 2048 characters).")
        if not re.match(r"^https?://", v, re.IGNORECASE):
            raise ValueError("URL must start with http:// or https://.")
        return v


class LectureOutBrief(ORMModel):
    """Lightweight lecture info for the Library screen."""

    id: str
    title: str
    channel: str
    url: str
    duration: int
    added_at: datetime
    status: str
    thumbnail: str
    duration_sec: int | None = None
