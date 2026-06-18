"""Signals for relaxed local-development behavior."""

from __future__ import annotations

from app.core.config import Settings, get_settings
from app.infra.redis_client import is_in_memory_redis, is_local_redis_deployment


def exposes_otp_debug_code(settings: Settings | None = None) -> bool:
    """Return OTP in API responses when running without production-grade infra."""
    resolved = settings or get_settings()
    if resolved.env == "local":
        return True
    if is_in_memory_redis():
        return True
    return is_local_redis_deployment(resolved.redis_url)
