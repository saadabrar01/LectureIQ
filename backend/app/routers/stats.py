from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import ChatMessage, Document, Lecture, QueryHistory, User
from app.schemas import StatsOut

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    """Calculate realtime workspace stats for the active user."""
    lectures_count = db.scalar(select(func.count(Lecture.id))) or 0
    docs_count = db.scalar(select(func.count(Document.id))) or 0
    total_sources = lectures_count + docs_count

    chat_q = (
        db.scalar(
            select(func.count(ChatMessage.id)).where(ChatMessage.role == "user")
        )
        or 0
    )
    history_q = db.scalar(select(func.count(QueryHistory.id))) or 0
    total_questions = chat_q + history_q

    total_sec = (
        db.scalar(select(func.coalesce(func.sum(Lecture.duration), 0))) or 0
    )

    user = db.scalars(select(User).limit(1)).first()
    streak_val = user.streak if user else 1

    return StatsOut(
        videos_processed=total_sources,
        questions_asked=total_questions,
        streak=streak_val,
        minutes_watched=int(total_sec) // 60,
    )
