"""In-process Redis substitute for local development without a Redis server."""

from __future__ import annotations

from typing import Any


class InMemoryPubSub:
    """No-op pub/sub stub so feed websocket setup fails gracefully in memory mode."""

    async def psubscribe(self, pattern: str) -> None:  # noqa: ARG002
        return None

    async def get_message(
        self,
        *,
        ignore_subscribe_messages: bool = True,  # noqa: ARG002
        timeout: float = 1.0,  # noqa: ARG002
    ) -> None:
        return None

    async def aclose(self) -> None:
        return None


class InMemoryRedis:
    """Minimal async Redis API used by auth, idempotency, and rate limiting."""

    def __init__(self) -> None:
        self._store: dict[str, str] = {}
        self._counter: dict[str, int] = {}

    async def ping(self) -> bool:
        return True

    async def set(self, key: str, value: str, ex: int | None = None) -> None:  # noqa: ARG002
        self._store[key] = value

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def delete(self, key: str) -> int:
        existed = key in self._store
        self._store.pop(key, None)
        self._counter.pop(key, None)
        return 1 if existed else 0

    async def incr(self, key: str) -> int:
        self._counter[key] = self._counter.get(key, 0) + 1
        return self._counter[key]

    async def expire(self, key: str, seconds: int) -> bool:  # noqa: ARG002
        return key in self._counter or key in self._store

    async def xadd(self, name: str, fields: dict[str, Any], **kwargs: Any) -> str:  # noqa: ARG002
        return "0-0"

    async def xread(self, streams: dict[str, str], **kwargs: Any) -> list:  # noqa: ARG002
        return []

    async def xlen(self, name: str) -> int:  # noqa: ARG002
        return 0

    async def xrange(self, name: str, min: str, max: str, **kwargs: Any) -> list:  # noqa: ARG002
        return []

    async def publish(self, channel: str, message: str) -> int:  # noqa: ARG002
        return 0

    def pubsub(self) -> InMemoryPubSub:
        return InMemoryPubSub()

    async def aclose(self) -> None:
        return None
