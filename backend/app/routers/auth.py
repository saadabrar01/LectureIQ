import re
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_effective_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models import User
from app.schemas import LoginRequest, ProfileUpdateRequest, SignupRequest, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Avatar upload constraints
MAX_AVATAR_BYTES = 2 * 1024 * 1024  # 2 MB
ALLOWED_AVATAR_TYPES = {"jpg", "jpeg", "png", "webp"}


@router.get("/me", response_model=UserOut)
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user),
):
    """Fetch the current user profile (authenticated user, else default)."""
    return current_user


@router.put("/profile", response_model=UserOut)
def update_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user),
):
    """Update profile data (name, username, email, bio, avatar_url) in PostgreSQL."""
    user = current_user

    if payload.name is not None and payload.name.strip():
        user.name = payload.name.strip()
        words = user.name.split()
        user.avatar = "".join(w[0] for w in words[:2]).upper() if words else "SA"
    if payload.email is not None and payload.email.strip():
        user.email = payload.email.strip().lower()
    if payload.username is not None:
        user.username = payload.username.strip()
    if payload.bio is not None:
        user.bio = payload.bio.strip()
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url.strip()

    db.commit()
    db.refresh(user)
    return user


@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user),
):
    """Upload user avatar image file, save to disk, and update PostgreSQL user record."""
    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=422, detail="Empty avatar file")
    if len(file_bytes) > MAX_AVATAR_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Avatar too large. Maximum size is {MAX_AVATAR_BYTES // (1024*1024)} MB.",
        )

    ext = (file.filename or "avatar.jpg").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_AVATAR_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image type. Allowed: {', '.join(sorted(ALLOWED_AVATAR_TYPES))}",
        )

    avatars_dir = Path(settings.uploads_dir) / "avatars"
    avatars_dir.mkdir(parents=True, exist_ok=True)

    filename = f"avatar_{uuid.uuid4().hex[:8]}.{ext}"
    target_path = avatars_dir / filename

    # Path traversal safety: ensure the resolved path is inside avatars_dir
    if not target_path.resolve().is_relative_to(avatars_dir.resolve()):
        raise HTTPException(status_code=400, detail="Invalid file path")

    target_path.write_bytes(file_bytes)

    avatar_url = f"/uploads/avatars/{filename}"

    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)

    return {"avatar_url": avatar_url}


@router.post("/signup", response_model=UserOut, status_code=201)
@limiter.limit("5/hour")
def signup(request: Request, payload: SignupRequest, db: Session = Depends(get_db)):
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
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(
        select(User).where(User.email == payload.email.strip().lower())
    )
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user


@router.post("/login-token")
@limiter.limit("10/minute")
def login_token(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    """Login and return a JWT access token."""
    user = db.scalar(
        select(User).where(User.email == payload.email.strip().lower())
    )
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.id, user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.jwt_expire_minutes * 60,
    }


@router.post("/signup-token")
@limiter.limit("5/hour")
def signup_token(request: Request, payload: SignupRequest, db: Session = Depends(get_db)):
    """Signup and return a JWT access token."""
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
    token = create_access_token(user.id, user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.jwt_expire_minutes * 60,
    }
