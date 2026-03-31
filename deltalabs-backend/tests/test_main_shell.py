"""HTTP shell tests (middleware, health, and v1 routing)."""

from app.main import app
from fastapi.testclient import TestClient


def test_health_endpoint() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_request_id_preserved_when_sent() -> None:
    with TestClient(app) as client:
        response = client.get("/health", headers={"X-Request-Id": "req-123"})
    assert response.status_code == 200
    assert response.headers["X-Request-Id"] == "req-123"


def test_request_id_generated_when_missing() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.headers["X-Request-Id"]


def test_v1_router_status_endpoint() -> None:
    with TestClient(app) as client:
        response = client.get("/v1/system/status")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_idempotency_header_is_echoed_when_present() -> None:
    with TestClient(app) as client:
        response = client.get("/health", headers={"Idempotency-Key": "idem-123"})
    assert response.status_code == 200
    assert response.headers["Idempotency-Key"] == "idem-123"
