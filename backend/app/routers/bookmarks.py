from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_effective_user
from app.db.session import get_db
from app.models import Bookmark, Lecture, User
from app.schemas import BookmarkCreate, BookmarkOut

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.get("", response_model=list[BookmarkOut])
def list_bookmarks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user),
):
    return db.scalars(
        select(Bookmark)
        .where(Bookmark.user_id == current_user.id)
        .order_by(Bookmark.created_at.desc())
    ).all()


@router.post("", response_model=BookmarkOut, status_code=201)
def create_bookmark(
    payload: BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user),
):
    lecture = db.scalar(
        select(Lecture).where(
            Lecture.id == payload.lecture_id,
            Lecture.user_id == current_user.id,
        )
    )
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    bookmark = Bookmark(
        id=payload.id or uuid4().hex[:12],
        user_id=current_user.id,
        **payload.model_dump(exclude={"id"}),
        created_at=datetime.now(),
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return bookmark


@router.delete("/{bookmark_id}", status_code=204)
def delete_bookmark(
    bookmark_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user),
):
    bookmark = db.scalar(
        select(Bookmark).where(
            Bookmark.id == bookmark_id,
            Bookmark.user_id == current_user.id,
        )
    )
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(bookmark)
    db.commit()
