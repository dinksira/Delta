"""Redis (async) client lifecycle and FastAPI dependency."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Any

import redis.asyncio as redis
from redis.asyncio import Redis

from app.core.config import get_settings

_redis: Redis[Any] | None = None


async def connect_redis() -> None:
    """Create the shared Redis client (idempotent)."""
    global _redis
    if _redis is not None:
        return
    settings = get_settings()
    _redis = redis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
        max_connections=settings.redis_max_connections,
    )


async def disconnect_redis() -> None:
    """Close the Redis client."""
    global _redis
    if _redis is not None:
        await _redis.aclose()  # type: ignore[attr-defined]
        _redis = None


def get_redis_client() -> Redis[Any]:
    """Return the process-wide Redis client."""
    if _redis is None:
        msg = "Redis client is not initialized; ensure application lifespan has started."
        raise RuntimeError(msg)
    return _redis


async def get_redis() -> AsyncGenerator[Redis[Any], None]:
    """FastAPI dependency: yield the Redis client."""
    yield get_redis_client()
