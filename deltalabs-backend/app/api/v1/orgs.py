"""Organization lifecycle endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_db
from app.domain.authorization.repository import Repository as AuthorizationRepository
from app.domain.authorization.schemas import (
    MyOrgsResponse,
    OrgCreateRequest,
    OrgCreateResponse,
    OrgJoinResponse,
)
from app.domain.authorization.service import Service as AuthorizationService

# ################################ CONSTANTS ################################
# Router declaration for organization lifecycle APIs.
router = APIRouter(prefix="/orgs", tags=["orgs"])
# ################################ /CONSTANTS ################################


# ################################ HELPERS ################################
# Internal helper for authz service construction.
def _authz_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> AuthorizationService:
    return AuthorizationService(AuthorizationRepository(db))


# ################################ /HELPERS ################################


# ################################ ROUTES ################################
# API routes for create/list/join organization flows.
@router.post("", response_model=OrgCreateResponse)
async def create_org(
    payload: OrgCreateRequest,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> OrgCreateResponse:
    service = _authz_service(db)
    await service.bootstrap_defaults()
    return await service.create_org_for_user(user_id=user.user_id, payload=payload)


@router.get("/me", response_model=MyOrgsResponse)
async def list_my_orgs(
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> MyOrgsResponse:
    service = _authz_service(db)
    await service.bootstrap_defaults()
    return await service.list_my_orgs(user_id=user.user_id)


@router.post("/{org_id}/join", response_model=OrgJoinResponse)
async def join_org(
    org_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> OrgJoinResponse:
    service = _authz_service(db)
    await service.bootstrap_defaults()
    return await service.join_org(user_id=user.user_id, org_id=org_id)


# ################################ /ROUTES ################################
