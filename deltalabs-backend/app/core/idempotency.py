"""Redis-backed idempotency replay for safe retries."""

from __future__ import annotations

import hashlib
import json
from collections.abc import Awaitable, Callable
from typing import Any

from app.compat.redis_typing import AsyncRedis
from redis.exceptions import RedisError

ExecuteFn = Callable[[], Awaitable[dict[str, Any]]]

RedisDep = AsyncRedis


async def replay_or_execute(
    redis: RedisDep,
    *,
    scope: str,
    idempotency_key: str | None,
    ttl_seconds: int,
    execute: ExecuteFn,
) -> dict[str, Any]:
    """Return cached JSON body if key exists; otherwise run `execute` and cache."""
    # ################################ IDEMPOTENCY ################################
    if idempotency_key is None or not idempotency_key.strip():
        return await execute()

    digest = hashlib.sha256(f"{scope}:{idempotency_key.strip()}".encode()).hexdigest()
    cache_key = f"idempotency:response:{digest}"
    try:
        cached = await redis.get(cache_key)
    except RedisError:
        return await execute()
    if cached is not None:
        return dict(json.loads(cached))

    result = await execute()
    try:
        await redis.set(cache_key, json.dumps(result), ex=ttl_seconds)
    except RedisError:
        return result
    return result


# ################################ /IDEMPOTENCY ################################
