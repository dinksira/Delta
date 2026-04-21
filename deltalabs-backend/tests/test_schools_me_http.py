"""HTTP tests for POST /v1/schools (me-centric school creation)."""

from __future__ import annotations

from app.main import app
from fastapi.testclient import TestClient


def _minimal_create_school_json() -> dict[str, object]:
    return {
        "name": "Test School",
        "schoolType": "University",
        "partners": [
            {"fullName": "Owner", "ownershipPercentage": 100},
        ],
    }


def test_create_school_me_requires_authentication() -> None:
    with TestClient(app) as client:
        response = client.post("/v1/schools", json=_minimal_create_school_json())
    assert response.status_code == 401


def test_openapi_has_post_schools_me() -> None:
    with TestClient(app) as client:
        spec = client.get("/openapi.json").json()
    assert "post" in spec["paths"].get("/v1/schools", {})


# ################################ MODULE ################################
# ################################ /MODULE ################################
