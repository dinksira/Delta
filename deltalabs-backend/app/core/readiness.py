"""Dependency readiness checks (MongoDB + Redis)."""

from __future__ import annotations

from typing import Any

from app.infra.database import get_database
from app.infra.redis_client import get_redis_client


async def run_readiness_checks() -> tuple[bool, dict[str, Any]]:
    """Ping MongoDB and Redis. Returns (all_ok, detail)."""
    # ################################ READINESS ################################
    mongo_ok = False
    redis_ok = False
    mongo_error: str | None = None
    redis_error: str | None = None

    try:
        db = get_database()
        await db.command("ping")
        mongo_ok = True
    except Exception as exc:  # noqa: BLE001 — probe must not raise
        mongo_error = type(exc).__name__

    try:
        client = get_redis_client()
        pong = await client.ping()
        redis_ok = bool(pong)
    except Exception as exc:  # noqa: BLE001
        redis_error = type(exc).__name__

    detail: dict[str, Any] = {
        "mongodb": {"ok": mongo_ok, "error": mongo_error},
        "redis": {"ok": redis_ok, "error": redis_error},
    }
    return mongo_ok and redis_ok, detail


# ################################ /READINESS ################################
