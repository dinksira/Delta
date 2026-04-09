"""Unit tests for idempotency helper."""

import pytest
from app.core.idempotency import replay_or_execute


class FakeRedis:
    def __init__(self) -> None:
        self._data: dict[str, str] = {}

    async def get(self, key: str) -> str | None:
        return self._data.get(key)

    async def set(self, key: str, value: str, ex: int | None = None) -> None:  # noqa: ARG002
        self._data[key] = value


@pytest.mark.asyncio
async def test_replay_returns_cached_payload() -> None:
    redis = FakeRedis()
    calls = 0

    async def execute() -> dict[str, object]:
        nonlocal calls
        calls += 1
        return {"ok": True, "n": 1}

    first = await replay_or_execute(
        redis,  # type: ignore[arg-type]
        scope="test:scope",
        idempotency_key="key-1",
        ttl_seconds=60,
        execute=execute,
    )
    second = await replay_or_execute(
        redis,  # type: ignore[arg-type]
        scope="test:scope",
        idempotency_key="key-1",
        ttl_seconds=60,
        execute=execute,
    )
    assert first == second
    assert calls == 1


@pytest.mark.asyncio
async def test_without_key_runs_each_time() -> None:
    redis = FakeRedis()
    calls = 0

    async def execute() -> dict[str, object]:
        nonlocal calls
        calls += 1
        return {"ok": True}

    await replay_or_execute(
        redis,  # type: ignore[arg-type]
        scope="test:scope",
        idempotency_key=None,
        ttl_seconds=60,
        execute=execute,
    )
    await replay_or_execute(
        redis,  # type: ignore[arg-type]
        scope="test:scope",
        idempotency_key=None,
        ttl_seconds=60,
        execute=execute,
    )
    assert calls == 2


# ################################ MODULE ################################
# ################################ /MODULE ################################
