from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Lecture(Base):
    __tablename__ = "lectures"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    channel: Mapped[str] = mapped_column(String(255))
    video_id: Mapped[str] = mapped_column(String(64))
    url: Mapped[str] = mapped_column(String(512))
    duration: Mapped[int] = mapped_column(Integer)  # seconds
    added_at: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(16), default="queued")  # queued|processing|ready|error
    progress: Mapped[int] = mapped_column(Integer, default=0)  # 0-100
    thumbnail: Mapped[str] = mapped_column(String(512))
    duration_sec: Mapped[int | None] = mapped_column(Integer, nullable=True)

    transcript: Mapped[list["TranscriptSegment"]] = relationship(
        back_populates="lecture", cascade="all, delete-orphan", order_by="TranscriptSegment.start"
    )
    messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="lecture", cascade="all, delete-orphan", order_by="ChatMessage.timestamp"
    )
    notes: Mapped[list["Note"]] = relationship(back_populates="lecture")
    bookmarks: Mapped[list["Bookmark"]] = relationship(
        back_populates="lecture", cascade="all, delete-orphan"
    )
    quiz_questions: Mapped[list["QuizQuestion"]] = relationship(
        back_populates="lecture", cascade="all, delete-orphan", order_by="QuizQuestion.source_time"
    )
    chunks: Mapped[list["LectureChunk"]] = relationship(
        back_populates="lecture", cascade="all, delete-orphan"
    )


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lecture_id: Mapped[str] = mapped_column(ForeignKey("lectures.id"))
    start: Mapped[int] = mapped_column(Integer)  # seconds into the video
    text: Mapped[str] = mapped_column(Text)

    lecture: Mapped[Lecture] = relationship(back_populates="transcript")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    lecture_id: Mapped[str | None] = mapped_column(ForeignKey("lectures.id"), nullable=True)
    role: Mapped[str] = mapped_column(String(8))  # user|ai
    text: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(DateTime)
    citations: Mapped[list | None] = mapped_column(JSON, default=None)  # [{time}]
    saved: Mapped[bool] = mapped_column(default=False)

    lecture: Mapped[Lecture | None] = relationship(back_populates="messages")


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    lecture_id: Mapped[str | None] = mapped_column(ForeignKey("lectures.id"), nullable=True)
    color: Mapped[str] = mapped_column(String(16), default="#8EF0A3")
    updated_at: Mapped[datetime] = mapped_column(DateTime)

    lecture: Mapped[Lecture | None] = relationship(back_populates="notes")

    @property
    def lecture_title(self) -> str | None:
        return self.lecture.title if self.lecture else None


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    lecture_id: Mapped[str] = mapped_column(ForeignKey("lectures.id"))
    quote: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime)

    lecture: Mapped[Lecture] = relationship(back_populates="bookmarks")

    @property
    def lecture_title(self) -> str:
        return self.lecture.title


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    lecture_id: Mapped[str] = mapped_column(ForeignKey("lectures.id"))
    question: Mapped[str] = mapped_column(Text)
    options: Mapped[list] = mapped_column(JSON, default=list)  # [str]
    correct_index: Mapped[int] = mapped_column(Integer)
    explanation: Mapped[str] = mapped_column(Text)
    source_time: Mapped[int] = mapped_column(Integer)  # seconds into the video

    lecture: Mapped[Lecture] = relationship(back_populates="quiz_questions")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    avatar: Mapped[str] = mapped_column(String(8), default="")
    join_date: Mapped[str] = mapped_column(String(32), default="")
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    videos_processed: Mapped[int] = mapped_column(Integer, default=0)
    questions_asked: Mapped[int] = mapped_column(Integer, default=0)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    minutes_watched: Mapped[int] = mapped_column(Integer, default=0)


class Document(Base):
    """An uploaded PDF or DOCX file that has been indexed for RAG.

    The original file is persisted on disk under `uploads_dir` (see
    settings); `file_path` records where. Extracted text lives in the
    related DocumentChunk rows together with their embeddings.
    """

    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    file_name: Mapped[str] = mapped_column(String(512))
    file_path: Mapped[str] = mapped_column(String(1024), default="")
    file_type: Mapped[str] = mapped_column(String(16))  # pdf | docx
    file_size: Mapped[int] = mapped_column(Integer)  # bytes
    num_pages: Mapped[int] = mapped_column(Integer, default=0)
    num_chunks: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    chunks: Mapped[list["DocumentChunk"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class DocumentChunk(Base):
    """A text chunk of a document together with its vector embedding.

    The column type is finalized at startup in `vector_support.adapt_chunk_column`:
    - pgvector available  -> `Vector(dims)` with dims from the resolved
      embedding provider (384 for local BGE, 1536 for OpenAI)
    - no pgvector         -> JSONB with in-Python cosine ranking

    The JSONB here is only a placeholder so the class can be imported.
    """

    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id"), index=True
    )
    content: Mapped[str] = mapped_column(Text)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    chunk_index: Mapped[int] = mapped_column(Integer, default=0)
    embedding: Mapped[list] = mapped_column(JSONB)

    document: Mapped[Document] = relationship(back_populates="chunks")


class QueryHistory(Base):
    """One RAG question/answer interaction, kept for the Activity Log screen."""

    __tablename__ = "query_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    answer_source: Mapped[str] = mapped_column(String(32), default="llm")
    # Document the question was scoped to (null = searched across all docs).
    document_id: Mapped[int | None] = mapped_column(
        ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )
    sources: Mapped[list | None] = mapped_column(JSONB, default=None)  # grouped RagSource dicts
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class LectureChunk(Base):
    """A text chunk of a lecture transcript with its vector embedding.

    Mirrors DocumentChunk but scoped to a lecture's transcript segments.
    Carries a timestamp_sec so citations can say 'From 4:12 in the video'.
    """

    __tablename__ = "lecture_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lecture_id: Mapped[str] = mapped_column(
        ForeignKey("lectures.id", ondelete="CASCADE"), index=True
    )
    chunk_text: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list] = mapped_column(JSONB)
    timestamp_sec: Mapped[int | None] = mapped_column(Integer, nullable=True)
    chunk_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    lecture: Mapped[Lecture] = relationship(back_populates="chunks")
