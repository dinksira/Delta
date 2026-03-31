"""Tests for global error mapping and response shape."""

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.main import app
from fastapi import APIRouter, Query
from fastapi.testclient import TestClient


def _ensure_test_error_routes() -> None:
    existing_paths = {route.path for route in app.routes}
    if "/test-errors/not-found" in existing_paths:
        return

    router = APIRouter(prefix="/test-errors", tags=["test-errors"])

    @router.get("/not-found")
    async def raise_not_found() -> None:
        raise NotFoundError("Course not found.")

    @router.get("/conflict")
    async def raise_conflict() -> None:
        raise ConflictError("Enrollment already exists.")

    @router.get("/validation")
    async def raise_validation() -> None:
        raise ValidationError("Invalid enrollment state.", details={"field": "status"})

    @router.get("/request-validation")
    async def request_validation(limit: int = Query(..., ge=1)) -> dict[str, int]:
        return {"limit": limit}

    @router.get("/unexpected")
    async def raise_unexpected() -> None:
        raise RuntimeError("kaboom")

    app.include_router(router)


def test_domain_error_shape_and_statuses() -> None:
    _ensure_test_error_routes()
    with TestClient(app, raise_server_exceptions=False) as client:
        response_404 = client.get("/test-errors/not-found", headers={"X-Request-Id": "r1"})
        response_409 = client.get("/test-errors/conflict", headers={"X-Request-Id": "r2"})
        response_400 = client.get("/test-errors/validation", headers={"X-Request-Id": "r3"})

    assert response_404.status_code == 404
    assert response_404.json()["code"] == "not_found"
    assert response_404.json()["requestId"] == "r1"

    assert response_409.status_code == 409
    assert response_409.json()["code"] == "conflict"
    assert response_409.json()["requestId"] == "r2"

    assert response_400.status_code == 400
    assert response_400.json()["code"] == "validation_error"
    assert response_400.json()["details"] == {"field": "status"}
    assert response_400.json()["requestId"] == "r3"


def test_request_validation_handler_shape() -> None:
    _ensure_test_error_routes()
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get("/test-errors/request-validation?limit=0")

    body = response.json()
    assert response.status_code == 400
    assert body["code"] == "request_validation_error"
    assert body["message"] == "Request validation failed."
    assert body["requestId"]
    assert isinstance(body["details"], list)


def test_unexpected_handler_shape() -> None:
    _ensure_test_error_routes()
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get("/test-errors/unexpected", headers={"X-Request-Id": "r500"})

    body = response.json()
    assert response.status_code == 500
    assert body["code"] == "internal_server_error"
    assert body["requestId"] == "r500"
    assert "message" in body
