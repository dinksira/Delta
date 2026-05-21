"""Feature catalog API with org-scoped RBAC checks."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_db
from app.api.deps_authz import (
    get_authorization_service,
    require_org_membership,
    require_org_permission,
)
from app.core.config import get_settings
from app.core.exceptions import PermissionDeniedError
from app.domain.authorization.service import Service as AuthorizationService
from app.domain.features_layout.repository import Repository as FeaturesLayoutRepository
from app.domain.features_layout.schemas import (
    FeaturesLayoutResponse,
    FeaturesLayoutUpsertRequest,
)
from app.domain.features_layout.service import Service as FeaturesLayoutService
from app.domain.library.repository import Repository
from app.domain.library.schemas import (
    FeatureCreateInput,
    FeatureDeleteResponse,
    FeaturePublic,
    FeatureSeedResponse,
    FeaturesListResponse,
    FeatureUpdateInput,
)
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


def _layout_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> FeaturesLayoutService:
    return FeaturesLayoutService(FeaturesLayoutRepository(db))


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


async def _resolve_system_org_id(authz: AuthorizationService) -> str:
    """Resolve configured default org slug to persistent org id."""
    settings = get_settings()
    org_doc = await authz._repository.find_org_by_slug(settings.authz_default_org_slug)  # noqa: SLF001
    if org_doc is None:
        await authz.bootstrap_defaults()
        org_doc = await authz._repository.find_org_by_slug(settings.authz_default_org_slug)  # noqa: SLF001
    if org_doc is None:
        return settings.authz_default_org_slug
    return str(org_doc["_id"])


async def _require_system_feature_admin(
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    authz: AuthorizationService = Depends(get_authorization_service),  # noqa: B008
) -> CurrentUser:
    """Ensure caller has system-level permission to manage feature catalog."""
    system_org_id = await _resolve_system_org_id(authz)
    profile = await authz.get_access_profile(user_id=user.user_id, org_id=system_org_id)
    permissions = set(profile.permissions)
    if "*" in permissions or "system:manage_features" in permissions:
        return user
    raise PermissionDeniedError(
        "System-level feature management permission is required.",
        code="system_feature_admin_required",
        details={
            "requiredPermission": "system:manage_features",
            "systemOrgId": system_org_id,
        },
    )


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


@router.get("/layout", response_model=FeaturesLayoutResponse)
async def get_features_layout(
    auth_ctx: tuple[CurrentUser, str] = Depends(_require_legacy_feature_access),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeaturesLayoutResponse:
    """Per-user Features card layout (order + hidden)."""
    user, _org_id = auth_ctx
    service = _layout_service(db)
    return await service.get_layout(user_id=user.user_id)


async def _upsert_features_layout(
    payload: FeaturesLayoutUpsertRequest,
    *,
    user: CurrentUser,
    org_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]],
    authz: AuthorizationService,
) -> FeaturesLayoutResponse:
    """Persist per-user Features card layout (validated by user's feature access)."""
    profile = await authz.get_access_profile(user_id=user.user_id, org_id=org_id)
    catalog = _service(db)
    await catalog.bootstrap_catalog()
    items = (await catalog.list_features(access_profile=profile)).items
    allowed_keys = {row.feature_key for row in items}

    service = _layout_service(db)
    return await service.upsert_layout(
        user_id=user.user_id,
        order_keys=payload.order_keys,
        hidden_keys=payload.hidden_keys,
        labels=payload.labels,
        allowed_keys=allowed_keys,
    )


@router.put("/layout", response_model=FeaturesLayoutResponse)
async def upsert_features_layout_put(
    payload: FeaturesLayoutUpsertRequest,
    auth_ctx: tuple[CurrentUser, str] = Depends(_require_legacy_feature_access),  # noqa: B008
    authz: AuthorizationService = Depends(get_authorization_service),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeaturesLayoutResponse:
    user, org_id = auth_ctx
    return await _upsert_features_layout(
        payload, user=user, org_id=org_id, db=db, authz=authz
    )


@router.post("/layout", response_model=FeaturesLayoutResponse)
async def upsert_features_layout_post(
    payload: FeaturesLayoutUpsertRequest,
    auth_ctx: tuple[CurrentUser, str] = Depends(_require_legacy_feature_access),  # noqa: B008
    authz: AuthorizationService = Depends(get_authorization_service),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeaturesLayoutResponse:
    """POST alias for clients / proxies that block PUT (mobile drag-and-drop save)."""
    user, org_id = auth_ctx
    return await _upsert_features_layout(
        payload, user=user, org_id=org_id, db=db, authz=authz
    )

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


@router.post("", response_model=FeaturePublic)
async def create_feature(
    payload: FeatureCreateInput,
    user: CurrentUser = Depends(_require_system_feature_admin),  # noqa: B008
    authz: AuthorizationService = Depends(get_authorization_service),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeaturePublic:
    """Create a system-level feature (super-admin only)."""
    system_org_id = await _resolve_system_org_id(authz)
    profile = await authz.get_access_profile(user_id=user.user_id, org_id=system_org_id)
    service = _service(db)
    await service.bootstrap_catalog()
    return await service.create_feature(payload, access_profile=profile)


@router.patch("/{feature_key}", response_model=FeaturePublic)
async def update_feature(
    feature_key: str,
    payload: FeatureUpdateInput,
    user: CurrentUser = Depends(_require_system_feature_admin),  # noqa: B008
    authz: AuthorizationService = Depends(get_authorization_service),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeaturePublic:
    """Update a system-level feature (super-admin only)."""
    system_org_id = await _resolve_system_org_id(authz)
    profile = await authz.get_access_profile(user_id=user.user_id, org_id=system_org_id)
    service = _service(db)
    await service.bootstrap_catalog()
    return await service.update_feature(feature_key, payload, access_profile=profile)


@router.delete("/{feature_key}", response_model=FeatureDeleteResponse)
async def delete_feature(
    feature_key: str,
    _: CurrentUser = Depends(_require_system_feature_admin),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeatureDeleteResponse:
    """Delete a system-level feature (super-admin only)."""
    service = _service(db)
    await service.bootstrap_catalog()
    return await service.delete_feature(feature_key)


@router.post("/seed-defaults", response_model=FeatureSeedResponse)
async def seed_default_features(
    _: CurrentUser = Depends(_require_system_feature_admin),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeatureSeedResponse:
    """Upsert default feature catalog rows (super-admin only)."""
    service = _service(db)
    return await service.seed_default_catalog()


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


@org_router.post(
    "",
    response_model=FeaturePublic,
    dependencies=[Depends(require_org_membership), Depends(require_org_permission("org:manage"))],
)
async def create_feature_for_org(
    org_id: str,
    payload: FeatureCreateInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    authz: AuthorizationService = Depends(get_authorization_service),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeaturePublic:
    """Create a feature under explicit org scope (admin/manage only)."""
    profile = await authz.get_access_profile(user_id=user.user_id, org_id=org_id)
    service = _service(db)
    await service.bootstrap_catalog()
    return await service.create_feature(payload, access_profile=profile)


@org_router.patch(
    "/{feature_key}",
    response_model=FeaturePublic,
    dependencies=[Depends(require_org_membership), Depends(require_org_permission("org:manage"))],
)
async def update_feature_for_org(
    org_id: str,
    feature_key: str,
    payload: FeatureUpdateInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    authz: AuthorizationService = Depends(get_authorization_service),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeaturePublic:
    """Update a feature under explicit org scope (admin/manage only)."""
    profile = await authz.get_access_profile(user_id=user.user_id, org_id=org_id)
    service = _service(db)
    await service.bootstrap_catalog()
    return await service.update_feature(feature_key, payload, access_profile=profile)


@org_router.delete(
    "/{feature_key}",
    response_model=FeatureDeleteResponse,
    dependencies=[Depends(require_org_membership), Depends(require_org_permission("org:manage"))],
)
async def delete_feature_for_org(
    org_id: str,
    feature_key: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeatureDeleteResponse:
    """Delete a feature under explicit org scope (admin/manage only)."""
    _ = org_id
    service = _service(db)
    await service.bootstrap_catalog()
    return await service.delete_feature(feature_key)


@org_router.post(
    "/seed-defaults",
    response_model=FeatureSeedResponse,
    dependencies=[Depends(require_org_membership), Depends(require_org_permission("org:manage"))],
)
async def seed_default_features_for_org(
    org_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeatureSeedResponse:
    """Upsert default feature catalog rows (admin/manage only)."""
    _ = org_id
    service = _service(db)
    return await service.seed_default_catalog()


# ################################ /ROUTES ################################
