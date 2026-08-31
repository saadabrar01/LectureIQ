from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_effective_user
from app.db.session import get_db
from app.models import ChatMessage, User
from app.schemas import ChatMessageCreate, ChatMessageOut

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("", response_model=list[ChatMessageOut])
def list_messages(
    lecture_id: str | None = None,
    saved_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user),
):
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.timestamp)
    )
    if lecture_id:
        stmt = stmt.where(ChatMessage.lecture_id == lecture_id)
    if saved_only:
        stmt = stmt.where(ChatMessage.saved.is_(True))
    return db.scalars(stmt).all()


@router.post("", response_model=ChatMessageOut, status_code=201)
def create_message(
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user),
):
    if payload.role not in ("user", "ai"):
        raise HTTPException(status_code=422, detail="role must be 'user' or 'ai'")
    message = ChatMessage(
        id=uuid4().hex[:12],
        user_id=current_user.id,
        **payload.model_dump(),
        timestamp=datetime.now(),
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.delete("/{message_id}", status_code=204)
def delete_message(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user),
):
    message = db.scalar(
        select(ChatMessage).where(
            ChatMessage.id == message_id,
            ChatMessage.user_id == current_user.id,
        )
    )
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(message)
    db.commit()
