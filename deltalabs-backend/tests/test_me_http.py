"""HTTP tests for /v1/me/* endpoints."""

from __future__ import annotations

from app.main import app
from fastapi.testclient import TestClient


def test_list_my_schools_requires_authentication() -> None:
    with TestClient(app) as client:
        response = client.get("/v1/me/schools")
    assert response.status_code == 401


def test_openapi_has_me_schools() -> None:
    with TestClient(app) as client:
        spec = client.get("/openapi.json").json()
    assert "get" in spec["paths"].get("/v1/me/schools", {})


# ################################ MODULE ################################
# ################################ /MODULE ################################
