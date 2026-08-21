"""Query history (Activity Log) endpoints.

Every /ask-rag interaction is recorded automatically; this router lets the
client list, inspect and remove those records.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import QueryHistory
from app.schemas import HistoryOut

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[HistoryOut])
def list_history(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Return the most recent Q&A interactions, newest first."""
    stmt = select(QueryHistory).order_by(QueryHistory.created_at.desc()).limit(limit).offset(offset)
    return db.scalars(stmt).all()


@router.delete("/{history_id}", status_code=204)
def delete_history_item(history_id: int, db: Session = Depends(get_db)):
    """Remove a single history entry."""
    item = db.get(QueryHistory, history_id)
    if not item:
        raise HTTPException(status_code=404, detail="History entry not found")
    db.delete(item)
    db.commit()


@router.delete("", status_code=204)
def clear_history(db: Session = Depends(get_db)):
    """Clear the entire query history."""
    for item in db.scalars(select(QueryHistory)).all():
        db.delete(item)
    db.commit()
