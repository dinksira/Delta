"""Tests for v1 stub routers."""

from app.main import app
from fastapi.testclient import TestClient

STUB_MODULES = [
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
    assert "/v1/system/metrics" in paths
    for module in STUB_MODULES:
        assert f"/v1/{module}" in paths
    assert "/v1/auth/signup/init" in paths
    assert "/v1/auth/login" in paths
    assert "/v1/orgs" in paths
    assert "/v1/orgs/me" in paths
    assert "/v1/orgs/{org_id}/join" in paths
    assert "/v1/auth/session" in paths
    assert "/v1/auth/logout" in paths
    assert "/v1/auth/verification/send" in paths
    assert "/v1/auth/verification/verify" in paths
    assert "/v1/auth/verification/resend" in paths
    assert "/v1/auth/signup/step/identity" in paths
    assert "/v1/auth/signup/step/contact" in paths
    assert "/v1/auth/signup/step/verification" in paths
    assert "/v1/auth/signup/step/dob" in paths
    assert "/v1/auth/signup/complete" in paths
    assert "/v1/auth/signup/state" in paths
    assert "/v1/auth/recover/request" in paths
    assert "/v1/auth/recover/verify" in paths
    assert "/v1/auth/recover/reset" in paths
    assert "/v1/feed" in paths
    assert "/v1/feed/{item_id}" in paths
    assert "/v1/feed/{item_id}/like" in paths
    assert "/v1/feed/{item_id}/save" in paths
    assert "/v1/feed/{item_id}/comment" in paths
    assert "/v1/feed/{item_id}/comments" in paths
    assert "/v1/feed/telemetry/summary" in paths
    assert "/v1/feed/{item_id}/share" in paths
    assert "/v1/feed/{item_id}/enroll" in paths
    assert "/v1/search" in paths
    assert "/v1/features" in paths
    assert "/v1/features/{feature_key}" in paths
    assert "/v1/media/ingest/callback" in paths
    assert "/v1/orgs/{org_id}/features" in paths
    assert "/v1/orgs/{org_id}/features/{feature_key}" in paths
    assert "/v1/orgs/{org_id}/media/upload-intent" in paths
    assert "/v1/orgs/{org_id}/media/{media_id}" in paths
    assert "/v1/orgs/{org_id}/schools" in paths
    assert "/v1/orgs/{org_id}/labs" in paths


# ################################ MODULE ################################
# ################################ /MODULE ################################
