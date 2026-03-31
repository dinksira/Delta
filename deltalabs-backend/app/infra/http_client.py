"""Shared outbound HTTP client (httpx) with sane timeouts."""

from collections.abc import AsyncGenerator

import httpx

from app.core.config import get_settings

_client: httpx.AsyncClient | None = None


async def connect_http_client() -> None:
    """Create the shared ``httpx.AsyncClient`` (idempotent)."""
    global _client
    if _client is not None:
        return
    settings = get_settings()
    timeout = httpx.Timeout(settings.http_timeout_seconds)
    _client = httpx.AsyncClient(timeout=timeout)


async def disconnect_http_client() -> None:
    """Close the HTTP client."""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def get_async_http_client() -> httpx.AsyncClient:
    """Return the process-wide ``AsyncClient``."""
    if _client is None:
        msg = "HTTP client is not initialized; ensure application lifespan has started."
        raise RuntimeError(msg)
    return _client


async def get_http_client_dep() -> AsyncGenerator[httpx.AsyncClient, None]:
    """FastAPI dependency: yield the shared client."""
    yield get_async_http_client()
