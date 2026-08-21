from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import ChatMessage, Lecture, User
from app.schemas import StatsOut

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    videos = db.scalar(
        select(func.count(Lecture.id)).where(Lecture.status == "ready")
    )
    questions = db.scalar(
        select(func.count(ChatMessage.id)).where(ChatMessage.role == "user")
    )
    minutes = db.scalar(
        select(func.coalesce(func.sum(Lecture.duration), 0)).where(
            Lecture.status == "ready"
        )
    )
    user = db.scalars(select(User).limit(1)).first()
    return StatsOut(
        videos_processed=videos or 0,
        questions_asked=questions or 0,
        streak=user.streak if user else 0,
        minutes_watched=int(minutes or 0) // 60,
    )
