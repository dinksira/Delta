"""HTTP tests for org-scoped RBAC endpoints."""

from __future__ import annotations

from app.api.deps import CurrentUser, get_current_user
from app.api.deps_authz import get_authorization_service
from app.domain.authorization.schemas import AuthorizationAccessProfile
from app.main import app
from fastapi.testclient import TestClient


class _AllowAuthz:
    async def get_access_profile(self, *, user_id: str, org_id: str) -> AuthorizationAccessProfile:
        _ = user_id
        return AuthorizationAccessProfile(
            org_id=org_id,
            role_keys=["student"],
            permissions=["content:read"],
            membership_state="member",
        )


class _DenyAuthz:
    async def get_access_profile(self, *, user_id: str, org_id: str) -> AuthorizationAccessProfile:
        _ = user_id
        _ = org_id
        return AuthorizationAccessProfile(
            org_id="org-a",
            role_keys=[],
            permissions=[],
            membership_state="none",
        )


async def _fake_user() -> CurrentUser:
    return CurrentUser(user_id="user-1")


def test_org_features_requires_authentication() -> None:
    with TestClient(app) as client:
        response = client.get("/v1/orgs/org-a/features")
    assert response.status_code == 401


def test_org_features_returns_200_when_authorized() -> None:
    app.dependency_overrides[get_current_user] = _fake_user
    app.dependency_overrides[get_authorization_service] = lambda: _AllowAuthz()
    try:
        with TestClient(app) as client:
            response = client.get("/v1/orgs/org-a/features")
        assert response.status_code == 200
        assert "items" in response.json()
    finally:
        app.dependency_overrides.clear()


def test_org_features_returns_403_when_forbidden() -> None:
    app.dependency_overrides[get_current_user] = _fake_user
    app.dependency_overrides[get_authorization_service] = lambda: _DenyAuthz()
    try:
        with TestClient(app) as client:
            response = client.get("/v1/orgs/org-a/features")
        assert response.status_code == 403
        assert response.json()["code"] == "org_membership_required"
    finally:
        app.dependency_overrides.clear()


# ################################ MODULE ################################
# ################################ /MODULE ################################
