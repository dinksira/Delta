"""Feature catalog API with org-scoped RBAC checks."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_db
from app.api.deps_authz import (
    get_authorization_service,
    require_org_membership,
)
from app.core.config import get_settings
from app.domain.authorization.service import Service as AuthorizationService
from app.domain.library.repository import Repository
from app.domain.library.schemas import FeaturePublic, FeaturesListResponse
from app.domain.library.service import Service

# ################################ CONSTANTS ################################
# Router declarations for compatibility and org-scoped feature endpoints.
router = APIRouter(prefix="/features", tags=["features"])
org_router = APIRouter(prefix="/orgs/{org_id}/features", tags=["features"])
# ################################ /CONSTANTS ################################


# ################################ HELPERS ################################
# Internal helper dependencies for service and compatibility access.
def _service(db: AsyncIOMotorDatabase[dict[str, object]]) -> Service:
    return Service(Repository(db))


async def _require_legacy_feature_access(
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    authz: AuthorizationService = Depends(get_authorization_service),  # noqa: B008
) -> tuple[CurrentUser, str]:
    settings = get_settings()
    org_id = settings.authz_default_org_slug
    profile = await authz.get_access_profile(user_id=user.user_id, org_id=org_id)
    if profile.membership_state == "none":
        # Compatibility: bootstrap a permissive synthetic profile for default public workspace.
        return user, org_id
    return user, org_id


# ################################ /HELPERS ################################


# ################################ ROUTES ################################
# HTTP routes for feature listing and detail in legacy + org-scoped mode.
@router.get("", response_model=FeaturesListResponse)
async def list_features(
    auth_ctx: tuple[CurrentUser, str] = Depends(_require_legacy_feature_access),  # noqa: B008
    authz: AuthorizationService = Depends(get_authorization_service),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeaturesListResponse:
    """Compatibility route; defaults to configured org scope."""
    user, org_id = auth_ctx
    profile = await authz.get_access_profile(user_id=user.user_id, org_id=org_id)
    service = _service(db)
    await service.bootstrap_catalog()
    return await service.list_features(access_profile=profile)


@router.get("/{feature_key}", response_model=FeaturePublic)
async def get_feature(
    feature_key: str,
    auth_ctx: tuple[CurrentUser, str] = Depends(_require_legacy_feature_access),  # noqa: B008
    authz: AuthorizationService = Depends(get_authorization_service),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeaturePublic:
    user, org_id = auth_ctx
    profile = await authz.get_access_profile(user_id=user.user_id, org_id=org_id)
    service = _service(db)
    await service.bootstrap_catalog()
    return await service.get_feature(feature_key, access_profile=profile)


@org_router.get(
    "",
    response_model=FeaturesListResponse,
    dependencies=[Depends(require_org_membership)],
)
async def list_features_for_org(
    org_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    authz: AuthorizationService = Depends(get_authorization_service),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeaturesListResponse:
    """List features under explicit org scope."""
    profile = await authz.get_access_profile(user_id=user.user_id, org_id=org_id)
    service = _service(db)
    await service.bootstrap_catalog()
    return await service.list_features(access_profile=profile)


@org_router.get(
    "/{feature_key}",
    response_model=FeaturePublic,
    dependencies=[Depends(require_org_membership)],
)
async def get_feature_for_org(
    org_id: str,
    feature_key: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    authz: AuthorizationService = Depends(get_authorization_service),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeaturePublic:
    profile = await authz.get_access_profile(user_id=user.user_id, org_id=org_id)
    service = _service(db)
    await service.bootstrap_catalog()
    return await service.get_feature(feature_key, access_profile=profile)


# ################################ /ROUTES ################################
