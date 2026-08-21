import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.db.session import get_db
from app.models import User
from app.schemas import LoginRequest, SignupRequest, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@router.post("/signup", response_model=UserOut, status_code=201)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    name = payload.name.strip()
    email = payload.email.strip().lower()
    if not name:
        raise HTTPException(status_code=422, detail="Enter your full name")
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=422, detail="Password must be at least 6 characters"
        )
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(
            status_code=409, detail="An account with this email already exists"
        )
    user = User(
        email=email,
        name=name,
        avatar="".join(word[0] for word in name.split()[:2]).upper(),
        join_date=datetime.now().strftime("%b %Y"),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=UserOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(
        select(User).where(User.email == payload.email.strip().lower())
    )
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user
