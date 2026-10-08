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
    await _hit("auth_post", ip, limit)


async def enforce_competition_rate_limits(
    request: Request,
    *,
    user_id: str | None,
) -> None:
    """Apply per-user fixed-window limits to the authenticated competition writes.

    Two independent buckets are enforced, because the cost profiles differ by
    two orders of magnitude:

    - `code_run` guards ``POST /competitions/{execute,submit}``. Every request
      spends real CPU on a Judge0 sandbox, so an unbounded caller here starves
      grading for every other user on a shared instance.
    - `competition_post` guards writes under ``/competitions/topic-battles``.
      Cheaper per call, but unbounded spam pollutes the public lobby.

    Anonymous callers fall back to the client IP, which is why the authenticated
    `user_id` is passed in explicitly rather than read from the session here.
    """
    settings = get_settings()
    ip = client_ip_for_rate_limit(request)
    subject = user_id if user_id else f"ip:{ip}"

    # Normalise so `/topic-battles/` and `/topic-battles` both match, and so a
    # single trailing slash does not silently disable a limit.
    path = request.url.path.rstrip("/")

    code_limit = settings.rate_limit_code_runs_per_minute
    if code_limit > 0 and path.endswith(("/execute", "/submit")):
        await _hit("code_run", subject, code_limit)

    post_limit = settings.rate_limit_competition_posts_per_minute
    if post_limit > 0 and _is_topic_battle_write(request, path):
        await _hit("competition_post", subject, post_limit)


def _is_topic_battle_write(request: Request, path: str) -> bool:
    """True for mutating requests against `/competitions/topic-battles[/...]`."""
    if request.method.upper() not in {"POST", "PUT", "PATCH", "DELETE"}:
        return False
    segments = path.split("/")
    # Path always ends with the collection, the battle id, or a sub-action, so
    # locating `topic-battles` anywhere in it covers create, join, cancel, and
    # the per-battle sub-actions without enumerating every route.
    return "topic-battles" in segments


async def _hit(bucket: str, subject: str, limit: int) -> None:
    """Increment a per-minute fixed window and raise once it exceeds `limit`.

    Fails open: if Redis is unavailable the request is allowed through rather
    than turned into an outage, matching the existing auth-post behaviour.
    """
    window = int(time.time()) // 60
    key = f"ratelimit:{bucket}:{subject}:{window}"
    try:
        redis = get_redis_client()
        n = await redis.incr(key)
        if n == 1:
            await redis.expire(key, 120)
    except (RedisError, OSError, RuntimeError) as exc:
        logger.warning(
            "rate_limit.redis_unavailable",
            extra={"error": type(exc).__name__, "bucket": bucket},
        )
        return
    if n > limit:
        raise RateLimitError("Too many requests.", code="rate_limited")


# ################################ /SECURITY ################################
