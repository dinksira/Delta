"""In-process Redis substitute for local development without a Redis server.

Supports the async surface used across the app (auth tokens, idempotency, rate
limiting, streams) plus a working pub/sub so realtime channels (feed, Live Duel
rooms) still fan out within a single uvicorn process. Subscriptions live in a
module-level broker, so every connection shares published events.
"""

from __future__ import annotations

import asyncio
import fnmatch
import threading
from typing import Any

# ################################ BROKER ################################
_BROKER: dict[str, set[asyncio.Queue]] = {}
_BROKER_PATTERNS: dict[str, set[asyncio.Queue]] = {}
_BROKER_LOCK = threading.Lock()


async def _first_available(queues: list[asyncio.Queue]) -> Any:
    """Wait for the first message across many subscriber queues.

    Raises `asyncio.TimeoutError` when cancelled or never resolved; the caller
    (a `wait_for`) turns that into the redis-py "nothing in this tick" outcome.
    """
    if not queues:
        raise TimeoutError
    tasks = [asyncio.ensure_future(queue.get()) for queue in queues]
    try:
        done, _pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            return task.result()
        raise TimeoutError
    finally:
        for task in tasks:
            if not task.done():
                task.cancel()


class InMemoryPubSub:
    """Single-subscriber handle over the module-level pub/sub broker."""

    def __init__(self) -> None:
        self._queues: list[asyncio.Queue] = []
        self._closed = False

    def _register(self, channel: str, *, pattern: bool) -> None:
        if self._closed:
            return
        queue: asyncio.Queue = asyncio.Queue()
        self._queues.append(queue)
        with _BROKER_LOCK:
            broker = _BROKER_PATTERNS if pattern else _BROKER
            broker.setdefault(channel, set()).add(queue)

    async def subscribe(self, channel: str) -> None:  # noqa: ARG002
        self._register(channel, pattern=False)

    async def psubscribe(self, pattern: str) -> None:  # noqa: ARG002
        self._register(pattern, pattern=True)

    async def unsubscribe(self, channel: str) -> None:
        with _BROKER_LOCK:
            queues = _BROKER.get(channel)
            if queues is not None:
                queues.difference_update(queue for queue in self._queues if queue in queues)
            queues = _BROKER_PATTERNS.get(channel)
            if queues is not None:
                queues.difference_update(queue for queue in self._queues if queue in queues)

    async def get_message(
        self,
        *,
        ignore_subscribe_messages: bool = True,  # noqa: ARG002
        timeout: float = 1.0,
    ) -> dict[str, Any] | None:
        """Return a redis-py shaped `{"type","channel","data"}` dict or `None` on timeout."""
        try:
            value = await asyncio.wait_for(
                _first_available([queue for queue in self._queues]),
                timeout=timeout,
            )
        except (TimeoutError, asyncio.CancelledError):
            return None
        return value

    async def aclose(self) -> None:
        self._closed = True
        with _BROKER_LOCK:
            for queues in [*_BROKER.values(), *_BROKER_PATTERNS.values()]:
                queues.difference_update(queue for queue in self._queues if queue in queues)
        self._queues.clear()


class InMemoryRedis:
    """Minimal async Redis API used by auth, idempotency, rate limiting, and pub/sub."""

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

    async def publish(self, channel: str, message: str) -> int:
        with _BROKER_LOCK:
            exact = list(_BROKER.get(channel, set()))
            matching: set[asyncio.Queue] = set()
            for pattern, queues in _BROKER_PATTERNS.items():
                if fnmatch.fnmatch(channel, pattern):
                    matching.update(queues)
        targets = [*exact, *matching]
        body = {"type": "message", "channel": channel, "data": message}
        for queue in targets:
            queue.put_nowait(body)
        return len(targets)

    def pubsub(self) -> InMemoryPubSub:
        return InMemoryPubSub()

    async def aclose(self) -> None:
        return None