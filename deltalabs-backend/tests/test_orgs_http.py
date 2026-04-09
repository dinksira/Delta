"""HTTP tests for organization lifecycle endpoints."""

from __future__ import annotations

from app.main import app
from fastapi.testclient import TestClient


def test_create_org_requires_authentication() -> None:
    with TestClient(app) as client:
        response = client.post("/v1/orgs", json={"name": "My Org", "slug": "my-org"})
    assert response.status_code == 401


def test_list_my_orgs_requires_authentication() -> None:
    with TestClient(app) as client:
        response = client.get("/v1/orgs/me")
    assert response.status_code == 401


def test_join_org_requires_authentication() -> None:
    with TestClient(app) as client:
        response = client.post("/v1/orgs/org-123/join")
    assert response.status_code == 401


# ################################ MODULE ################################
# ################################ /MODULE ################################
