"""Integration smoke tests for key HTTP surfaces."""

from app.main import app
from fastapi.testclient import TestClient


def test_health_and_v1_integration() -> None:
    with TestClient(app) as client:
        health = client.get("/health")
        v1 = client.get("/v1/system/status")

    assert health.status_code == 200
    assert health.json() == {"status": "ok"}
    assert v1.status_code == 200
    assert v1.json() == {"status": "ok"}


# ################################ MODULE ################################
# ################################ /MODULE ################################
