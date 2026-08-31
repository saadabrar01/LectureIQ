from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_effective_user
from app.db.session import get_db
from app.models import ChatMessage, Document, Lecture, QueryHistory, User
from app.schemas import StatsOut

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("", response_model=StatsOut)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user),
):
    """Calculate realtime workspace stats for the active user."""
    uid = current_user.id
    lectures_count = db.scalar(
        select(func.count(Lecture.id)).where(Lecture.user_id == uid)
    ) or 0
    docs_count = db.scalar(
        select(func.count(Document.id)).where(Document.user_id == uid)
    ) or 0
    total_sources = lectures_count + docs_count

    chat_q = (
        db.scalar(
            select(func.count(ChatMessage.id)).where(
                ChatMessage.role == "user",
                ChatMessage.user_id == uid,
            )
        )
        or 0
    )
    history_q = db.scalar(
        select(func.count(QueryHistory.id)).where(QueryHistory.user_id == uid)
    ) or 0
    total_questions = chat_q + history_q

    total_sec = (
        db.scalar(
            select(func.coalesce(func.sum(Lecture.duration), 0)).where(
                Lecture.user_id == uid
            )
        )
        or 0
    )

    return StatsOut(
        videos_processed=total_sources,
        questions_asked=total_questions,
        streak=current_user.streak,
        minutes_watched=int(total_sec) // 60,
    )
