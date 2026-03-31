from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from redis.asyncio import Redis

from app.infra.database import get_db as get_db_dep
from app.infra.redis_client import get_redis as get_redis_dep


async def get_db() -> AsyncIOMotorDatabase[dict[str, Any]]:
    """Shared DB dependency for API routes."""
    async for db in get_db_dep():
        return db
    raise RuntimeError("Database dependency did not yield a value")


async def get_redis() -> Redis[Any]:
    """Shared Redis dependency for API routes."""
    async for client in get_redis_dep():
        return client
    raise RuntimeError("Redis dependency did not yield a value")


@dataclass(slots=True)
class CurrentUser:
    """Auth placeholder model until JWT auth is implemented."""

    user_id: str


async def get_current_user() -> CurrentUser:
    """Auth placeholder dependency.

    Real JWT verification is added in the auth foundation phase.
    """
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"code": "unauthenticated", "message": "Authentication is not configured yet."},
    )
