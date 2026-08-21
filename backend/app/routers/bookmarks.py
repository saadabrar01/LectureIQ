from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Bookmark, Lecture
from app.schemas import BookmarkCreate, BookmarkOut

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.get("", response_model=list[BookmarkOut])
def list_bookmarks(db: Session = Depends(get_db)):
    return db.scalars(select(Bookmark).order_by(Bookmark.created_at.desc())).all()


@router.post("", response_model=BookmarkOut, status_code=201)
def create_bookmark(payload: BookmarkCreate, db: Session = Depends(get_db)):
    if not db.get(Lecture, payload.lecture_id):
        raise HTTPException(status_code=404, detail="Lecture not found")
    bookmark = Bookmark(
        id=payload.id or uuid4().hex[:12],
        **payload.model_dump(exclude={"id"}),
        created_at=datetime.now(),
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return bookmark


@router.delete("/{bookmark_id}", status_code=204)
def delete_bookmark(bookmark_id: str, db: Session = Depends(get_db)):
    bookmark = db.get(Bookmark, bookmark_id)
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(bookmark)
    db.commit()
