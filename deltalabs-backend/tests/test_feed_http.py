"""HTTP tests for feed endpoints."""

from app.main import app
from fastapi.testclient import TestClient


def test_get_feed_returns_paginated_shape() -> None:
    with TestClient(app) as client:
        response = client.get("/v1/feed?limit=3")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body
    assert "has_more" in body
    assert isinstance(body["items"], list)


def test_get_feed_item_not_found() -> None:
    with TestClient(app) as client:
        response = client.get("/v1/feed/does-not-exist-xyz")
    assert response.status_code == 404


def test_feed_like_requires_authentication() -> None:
    with TestClient(app) as client:
        response = client.post("/v1/feed/c1/like")
    assert response.status_code == 401


def test_feed_event_requires_authentication() -> None:
    with TestClient(app) as client:
        response = client.post("/v1/feed/c1/event", json={"event": "view_start"})
    assert response.status_code == 401


# ################################ MODULE ################################
# ################################ /MODULE ################################
