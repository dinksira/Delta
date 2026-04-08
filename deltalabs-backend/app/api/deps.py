from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import Depends, Header, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.compat.redis_typing import AsyncRedis
from app.core.security import hash_session_token
from app.domain.identity.repository import Repository
from app.infra.database import get_db as get_db_dep
from app.infra.redis_client import get_redis as get_redis_dep


# ################################ HELPERS ################################
# Shared DB and Redis dependencies used by API routers.
async def get_db() -> AsyncIOMotorDatabase[dict[str, Any]]:
    """Shared DB dependency for API routes."""
    async for db in get_db_dep():
        return db
    raise RuntimeError("Database dependency did not yield a value")


async def get_redis() -> AsyncRedis:
    """Shared Redis dependency for API routes."""
    async for client in get_redis_dep():
        return client
    raise RuntimeError("Redis dependency did not yield a value")


# ################################ /HELPERS ################################


# ################################ TYPES ################################
# Lightweight authenticated-user projection.
@dataclass(slots=True)
class CurrentUser:
    """Auth placeholder model until JWT auth is implemented."""

    user_id: str


# ################################ /TYPES ################################


# ################################ DEPENDENCIES ################################
# Authentication dependency that validates session token.
async def get_current_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: AsyncIOMotorDatabase[dict[str, Any]] = Depends(get_db),  # noqa: B008
) -> CurrentUser:
    """Resolve current user from bearer token and active session."""
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "unauthenticated", "message": "Missing bearer token."},
        )
    token = authorization[len("Bearer ") :].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "unauthenticated", "message": "Missing bearer token."},
        )

    repository = Repository(db)
    session_doc = await repository.find_session_by_token_hash(hash_session_token(token))
    if session_doc is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "unauthenticated", "message": "Session is invalid or expired."},
        )
    return CurrentUser(user_id=str(session_doc["user_id"]))


async def get_current_user_optional(
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: AsyncIOMotorDatabase[dict[str, Any]] = Depends(get_db),  # noqa: B008
) -> CurrentUser | None:
    """Resolve user when a valid bearer token is present, otherwise return None."""
    if authorization is None:
        return None
    if not authorization.startswith("Bearer "):
        return None
    token = authorization[len("Bearer ") :].strip()
    if not token:
        return None

    repository = Repository(db)
    session_doc = await repository.find_session_by_token_hash(hash_session_token(token))
    if session_doc is None:
        return None
    return CurrentUser(user_id=str(session_doc["user_id"]))


# ################################ /DEPENDENCIES ################################
