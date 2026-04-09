"""HTTP tests for features catalog (P7)."""

from app.api.deps import CurrentUser, get_current_user
from app.api.deps_authz import get_authorization_service
from app.domain.authorization.schemas import AuthorizationAccessProfile
from app.main import app
from fastapi.testclient import TestClient


def test_features_list_requires_authentication() -> None:
    with TestClient(app) as client:
        response = client.get("/v1/features")
    assert response.status_code == 401


def test_feature_detail_requires_authentication() -> None:
    with TestClient(app) as client:
        response = client.get("/v1/features/school")
    assert response.status_code == 401


class _ProfileAuthz:
    async def get_access_profile(self, *, user_id: str, org_id: str) -> AuthorizationAccessProfile:
        _ = user_id
        return AuthorizationAccessProfile(
            org_id=org_id,
            role_keys=["teacher"],
            permissions=["school:read", "school:manage", "content:read"],
            membership_state="staff",
        )


async def _fake_user() -> CurrentUser:
    return CurrentUser(user_id="u-1")


def test_features_list_includes_data_driven_capabilities() -> None:
    app.dependency_overrides[get_current_user] = _fake_user
    app.dependency_overrides[get_authorization_service] = lambda: _ProfileAuthz()
    try:
        with TestClient(app) as client:
            response = client.get("/v1/features")
        assert response.status_code == 200
        body = response.json()
        assert "items" in body
        assert isinstance(body["items"], list)
        if body["items"]:
            first = body["items"][0]
            assert "capabilities" in first
            assert "membershipState" in first
            assert "roleKeys" in first
    finally:
        app.dependency_overrides.clear()


# ################################ MODULE ################################
# ################################ /MODULE ################################
