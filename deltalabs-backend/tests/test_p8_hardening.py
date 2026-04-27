"""P8 operational checks: readiness, metrics, rate limits, light load."""

import uuid

import pytest
from app.core.config import get_settings
from app.main import app
from fastapi.testclient import TestClient


def test_ready_endpoint_reports_dependency_checks() -> None:
    """Contract test: works with or without local Mongo/Redis (CI may omit them)."""
    # ################################ MODULE ################################
    with TestClient(app) as client:
        response = client.get("/ready")
    assert response.status_code in (200, 503)
    body = response.json()
    assert body["status"] in ("ready", "not_ready")
    assert body["checks"]["mongodb"]["ok"] in (True, False)
    assert body["checks"]["redis"]["ok"] in (True, False)
    if response.status_code == 200:
        assert body["checks"]["mongodb"]["ok"] is True
        assert body["checks"]["redis"]["ok"] is True


def test_system_metrics_increments_with_requests() -> None:
    with TestClient(app) as client:
        before = client.get("/v1/system/metrics").json()["requests_total"]
        client.get("/health")
        after = client.get("/v1/system/metrics").json()["requests_total"]
    assert after >= before + 1


def test_auth_post_rate_limit_enforced(monkeypatch: pytest.MonkeyPatch) -> None:
    """Uses an in-memory fake Redis so the test does not require a live server."""

    class _FakeRedis:
        def __init__(self) -> None:
            self._counts: dict[str, int] = {}

        async def incr(self, key: str) -> int:
            self._counts[key] = self._counts.get(key, 0) + 1
            return self._counts[key]

        async def expire(self, _key: str, _ttl: int) -> bool:
            return True

    fake = _FakeRedis()

    def _fake_get_redis() -> _FakeRedis:
        return fake

    monkeypatch.setattr("app.core.rate_limit.get_redis_client", _fake_get_redis)
    monkeypatch.setenv("RATE_LIMIT_AUTH_POSTS_PER_MINUTE", "2")
    monkeypatch.setenv("TRUST_X_FORWARDED_FOR", "true")
    get_settings.cache_clear()
    payload = {"identity": "user@example.com", "password": "any"}
    n = uuid.uuid4().int % 200 + 1
    fake_ip = f"10.99.0.{n}"
    headers = {"X-Forwarded-For": fake_ip}
    try:
        with TestClient(app) as client:
            assert client.post("/v1/auth/login", json=payload, headers=headers).status_code != 429
            assert client.post("/v1/auth/login", json=payload, headers=headers).status_code != 429
            third = client.post("/v1/auth/login", json=payload, headers=headers)
        assert third.status_code == 429
        assert third.json()["code"] == "rate_limited"
    finally:
        monkeypatch.delenv("RATE_LIMIT_AUTH_POSTS_PER_MINUTE", raising=False)
        monkeypatch.delenv("TRUST_X_FORWARDED_FOR", raising=False)
        get_settings.cache_clear()


def test_load_smoke_many_health_requests() -> None:
    with TestClient(app) as client:
        for _ in range(50):
            assert client.get("/health").status_code == 200


# ################################ /MODULE ################################
