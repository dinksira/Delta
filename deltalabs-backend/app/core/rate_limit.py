"""Redis-backed fixed-window limits for hot HTTP surfaces."""

from __future__ import annotations

import logging
import time

from fastapi import Request
from redis.exceptions import RedisError

from app.core.config import get_settings
from app.core.exceptions import RateLimitError
from app.infra.redis_client import get_redis_client

logger = logging.getLogger("deltalabs.api")


def client_ip_for_rate_limit(request: Request) -> str:
    """Best-effort client IP; respects X-Forwarded-For only when configured."""
    # ################################ SECURITY ################################
    settings = get_settings()
    if settings.trust_x_forwarded_for:
        forwarded = request.headers.get("X-Forwarded-For")
        if isinstance(forwarded, str) and forwarded.strip():
            return forwarded.split(",")[0].strip()
    if request.client is not None:
        return request.client.host
    return "unknown"


async def enforce_auth_post_rate_limit(request: Request) -> None:
    """Apply per-IP limit to POST /v1/auth/* when enabled."""
    settings = get_settings()
    limit = settings.rate_limit_auth_posts_per_minute
    if limit <= 0:
        return

    prefix = f"{settings.api_v1_prefix.rstrip('/')}/auth"
    path = request.url.path
    if request.method.upper() != "POST" or not path.startswith(prefix):
        return

    ip = client_ip_for_rate_limit(request)
    bucket = int(time.time()) // 60
    key = f"ratelimit:auth_post:{ip}:{bucket}"
    try:
        redis = get_redis_client()
        n = await redis.incr(key)
        if n == 1:
            await redis.expire(key, 120)
    except (RedisError, OSError, RuntimeError) as exc:
        logger.warning(
            "rate_limit.redis_unavailable",
            extra={"error": type(exc).__name__, "path": request.url.path},
        )
        return
    if n > limit:
        raise RateLimitError("Too many requests.", code="rate_limited")


# ################################ /SECURITY ################################
