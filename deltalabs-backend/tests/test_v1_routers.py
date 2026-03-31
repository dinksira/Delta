"""Tests for v1 stub routers."""

from app.main import app
from fastapi.testclient import TestClient

STUB_MODULES = [
    "auth",
    "feed",
    "schools",
    "courses",
    "enrollments",
    "planner",
    "certification",
    "chatroom",
    "tutorials",
    "research",
    "competitions",
    "specialization",
    "library",
    "course_support",
    "rent_lab",
    "help_support",
]


def test_stub_routes_respond_not_implemented() -> None:
    with TestClient(app) as client:
        for module in STUB_MODULES:
            response = client.get(f"/v1/{module}")
            assert response.status_code == 200
            assert response.json() == {"status": "not_implemented", "module": module}


def test_openapi_contains_stub_paths() -> None:
    with TestClient(app) as client:
        spec = client.get("/openapi.json").json()

    paths = spec["paths"]
    assert "/v1/system/status" in paths
    for module in STUB_MODULES:
        assert f"/v1/{module}" in paths
