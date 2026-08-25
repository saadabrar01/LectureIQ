"""FastAPI dependencies for authentication and authorization.

Usage in routers:

    from app.core.deps import get_current_user
    from app.models import User

    @router.get("/protected")
    def secret_endpoint(user: User = Depends(get_current_user)):
        ...

If JWT is not enforced yet (frontend doesn't send tokens), routes can
optionally use `get_current_user_optional` which returns None instead of
401 when no token is provided.
"""

from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User


def _extract_bearer(authorization: str) -> str:
    """Extract the token from an Authorization: Bearer <token> header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return parts[1]


def get_current_user(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
) -> User:
    """Require a valid JWT and return the matching User."""
    token = _extract_bearer(authorization)
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = db.get(User, int(user_id))
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_current_user_optional(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Return the current User if a valid JWT is present, else None.

    Use this for endpoints that behave differently for authenticated vs
    anonymous users (e.g. personalized results) but don't require auth.
    """
    if not authorization:
        return None
    try:
        return get_current_user(authorization=authorization, db=db)
    except HTTPException:
        return None
