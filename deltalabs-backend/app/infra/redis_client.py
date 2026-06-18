"""Redis (async) client lifecycle and FastAPI dependency."""

from __future__ import annotations

import logging
from collections.abc import AsyncGenerator

import redis.asyncio as redis
from redis.exceptions import RedisError

from app.compat.redis_typing import AsyncRedis
from app.core.config import get_settings
from app.infra.memory_redis import InMemoryRedis

logger = logging.getLogger("deltalabs.api")

_redis: AsyncRedis | None = None


def is_in_memory_redis() -> bool:
    """True when the process is using the in-process Redis substitute."""
    return isinstance(_redis, InMemoryRedis)


def is_local_redis_deployment(redis_url: str) -> bool:
    """True when Redis URL points at this machine (typical local backend setup)."""
    lowered = redis_url.strip().lower()
    if lowered == "memory://":
        return True
    return "localhost" in lowered or "127.0.0.1" in lowered or lowered.startswith("redis://127.")


def _is_local_redis_url(redis_url: str) -> bool:
    return is_local_redis_deployment(redis_url)


def _use_in_memory_redis(*, reason: str) -> None:
    global _redis
    _redis = InMemoryRedis()  # type: ignore[assignment]
    logger.warning("redis.using_in_memory", extra={"reason": reason})


async def connect_redis() -> None:
    """Create the shared Redis client (idempotent)."""
    # ################################ INFRA ################################
    global _redis
    if _redis is not None:
        return
    settings = get_settings()

    if settings.redis_url.strip().lower() == "memory://":
        _use_in_memory_redis(reason="redis_url_memory")
        return

    # Upstash and other managed Redis providers use TLS (rediss://).
    # ssl_cert_reqs=None disables certificate verification — required for
    # Upstash's self-signed certs on the free tier.
    use_ssl = settings.redis_url.startswith("rediss://")

    # Only SSLConnection accepts ssl_cert_reqs; plain redis:// must not pass it or
    # AbstractConnection raises: unexpected keyword argument 'ssl_cert_reqs'.
    pool_kwargs: dict[str, object] = {
        "encoding": "utf-8",
        "decode_responses": True,
        "max_connections": settings.redis_max_connections,
    }
    if use_ssl:
        # Upstash and similar: relax verify for managed/self-signed TLS endpoints.
        pool_kwargs["ssl_cert_reqs"] = None

    client = redis.from_url(settings.redis_url, **pool_kwargs)
    try:
        await client.ping()
    except (RedisError, OSError) as exc:
        if not _is_local_redis_url(settings.redis_url):
            raise
        logger.warning(
            "redis.connection_failed",
            extra={"error": str(exc), "redis_url": settings.redis_url},
        )
        try:
            await client.aclose()  # type: ignore[attr-defined]
        except (RedisError, OSError):
            pass
        _use_in_memory_redis(reason="local_connection_failed")
        return

    _redis = client


async def disconnect_redis() -> None:
    """Close the Redis client."""
    global _redis
    if _redis is not None:
        await _redis.aclose()  # type: ignore[attr-defined]
        _redis = None


def get_redis_client() -> AsyncRedis:
    """Return the process-wide Redis client."""
    if _redis is None:
        msg = "Redis client is not initialized; ensure application lifespan has started."
        raise RuntimeError(msg)
    return _redis


async def get_redis() -> AsyncGenerator[AsyncRedis, None]:
    """FastAPI dependency: yield the Redis client."""
    yield get_redis_client()


# ################################ /INFRA ################################
