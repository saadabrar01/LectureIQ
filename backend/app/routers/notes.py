from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_effective_user
from app.db.session import get_db
from app.models import Note, User
from app.schemas import NoteCreate, NoteOut, NoteUpdate

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[NoteOut])
def list_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user),
):
    return db.scalars(
        select(Note)
        .where(Note.user_id == current_user.id)
        .order_by(Note.updated_at.desc())
    ).all()


@router.post("", response_model=NoteOut, status_code=201)
def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user),
):
    data = payload.model_dump()
    data["id"] = data["id"] or uuid4().hex[:12]
    # Verify lecture_id belongs to the current user to avoid cross-user links
    if data.get("lecture_id"):
        from app.models import Lecture
        exists = db.scalar(
            select(Lecture).where(
                Lecture.id == data["lecture_id"],
                Lecture.user_id == current_user.id,
            )
        )
        if not exists:
            data["lecture_id"] = None
    note = Note(**data, user_id=current_user.id, updated_at=datetime.now())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: str,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user),
):
    note = db.scalar(
        select(Note).where(Note.id == note_id, Note.user_id == current_user.id)
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    data = payload.model_dump(exclude_unset=True)
    if "lecture_id" in data and data["lecture_id"]:
        from app.models import Lecture
        exists = db.scalar(
            select(Lecture).where(
                Lecture.id == data["lecture_id"],
                Lecture.user_id == current_user.id,
            )
        )
        if not exists:
            data["lecture_id"] = None
    for field, value in data.items():
        setattr(note, field, value)
    note.updated_at = datetime.now()
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=204)
def delete_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user),
):
    note = db.scalar(
        select(Note).where(Note.id == note_id, Note.user_id == current_user.id)
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
