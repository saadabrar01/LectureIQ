from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Lecture, QuizQuestion
from app.schemas import LectureCreate, LectureDetailOut, LectureOut, QuizQuestionOut

router = APIRouter(prefix="/lectures", tags=["lectures"])


@router.get("", response_model=list[LectureOut])
def list_lectures(db: Session = Depends(get_db)):
    return db.scalars(select(Lecture).order_by(Lecture.added_at.desc())).all()


@router.post("", response_model=LectureOut, status_code=201)
def create_lecture(payload: LectureCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()
    data["id"] = data["id"] or uuid4().hex[:12]
    if not data["thumbnail"]:
        data["thumbnail"] = f"https://img.youtube.com/vi/{data['video_id']}/hqdefault.jpg"
    lecture = Lecture(**data, added_at=datetime.now())
    db.add(lecture)
    db.commit()
    db.refresh(lecture)
    return lecture


@router.get("/{lecture_id}", response_model=LectureDetailOut)
def get_lecture(lecture_id: str, db: Session = Depends(get_db)):
    lecture = db.get(Lecture, lecture_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture


@router.delete("/{lecture_id}", status_code=204)
def delete_lecture(lecture_id: str, db: Session = Depends(get_db)):
    lecture = db.get(Lecture, lecture_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    db.delete(lecture)
    db.commit()


@router.get("/{lecture_id}/quiz", response_model=list[QuizQuestionOut])
def list_quiz(lecture_id: str, db: Session = Depends(get_db)):
    if not db.get(Lecture, lecture_id):
        raise HTTPException(status_code=404, detail="Lecture not found")
    return db.scalars(
        select(QuizQuestion).where(QuizQuestion.lecture_id == lecture_id)
    ).all()
