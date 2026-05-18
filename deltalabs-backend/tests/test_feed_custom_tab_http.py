"""HTTP tests for per-user custom feed tab configuration."""

from app.api.deps import CurrentUser, get_current_user
from app.main import app
from fastapi.testclient import TestClient


async def _fake_user() -> CurrentUser:
    return CurrentUser(user_id="u-custom-tab-1")


def test_feed_custom_tab_requires_authentication() -> None:
    with TestClient(app) as client:
        response = client.get("/v1/me/feed/custom-tab")
    assert response.status_code == 401


def test_feed_custom_tab_not_configured_returns_404() -> None:
    app.dependency_overrides[get_current_user] = _fake_user
    try:
        with TestClient(app) as client:
            response = client.get("/v1/me/feed/custom-tab")
        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "feed_custom_tab_not_configured"
    finally:
        app.dependency_overrides.clear()


def test_feed_custom_tab_upsert_and_get() -> None:
    app.dependency_overrides[get_current_user] = _fake_user
    try:
        with TestClient(app) as client:
            put = client.put(
                "/v1/me/feed/custom-tab",
                json={
                    "label": "Neuro picks",
                    "filters": {"hashtag": "NeuroTech", "content_type": "video"},
                },
            )
            assert put.status_code == 200
            body = put.json()
            assert body["label"] == "Neuro picks"
            assert body["filters"]["hashtag"] == "NeuroTech"
            assert body["filters"]["content_type"] == "video"
            assert "updated_at" in body

            get = client.get("/v1/me/feed/custom-tab")
            assert get.status_code == 200
            assert get.json()["label"] == "Neuro picks"
    finally:
        app.dependency_overrides.clear()


def test_feed_custom_tab_rejects_empty_filters() -> None:
    app.dependency_overrides[get_current_user] = _fake_user
    try:
        with TestClient(app) as client:
            response = client.put(
                "/v1/me/feed/custom-tab",
                json={"label": "Empty", "filters": {}},
            )
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()
