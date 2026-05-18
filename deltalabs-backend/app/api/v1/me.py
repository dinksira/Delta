"""User-centric (`/me`) aggregates."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_db
from app.domain.feed_custom_tab.repository import Repository as FeedCustomTabRepository
from app.domain.feed_custom_tab.schemas import FeedCustomTabResponse, FeedCustomTabUpsertRequest
from app.domain.feed_custom_tab.service import Service as FeedCustomTabService
from app.domain.school.repository import Repository as SchoolRepository
from app.domain.school.schemas import MySchoolsResponse
from app.domain.school.service import Service as SchoolService

# ################################ CONSTANTS ################################
router = APIRouter(prefix="/me", tags=["me"])
# ################################ /CONSTANTS ################################


def _school_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> SchoolService:
    return SchoolService(SchoolRepository(db))


def _feed_custom_tab_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> FeedCustomTabService:
    return FeedCustomTabService(FeedCustomTabRepository(db))


@router.get(
    "/schools",
    response_model=MySchoolsResponse,
)
async def list_my_schools(
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> MySchoolsResponse:
    """Schools the current user belongs to (school-scoped roles; creators are ``school_owner``)."""
    service = _school_service(db)
    await service.bootstrap()
    return await service.list_my_schools(user_id=user.user_id)


@router.get(
    "/feed/custom-tab",
    response_model=FeedCustomTabResponse,
)
async def get_my_feed_custom_tab(
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeedCustomTabResponse:
    """Return the signed-in user's saved custom feed tab (label + feed filters)."""
    service = _feed_custom_tab_service(db)
    await service.bootstrap_indexes()
    doc = await service.get_for_user(user_id=user.user_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "feed_custom_tab_not_configured"},
        )
    return doc


@router.put(
    "/feed/custom-tab",
    response_model=FeedCustomTabResponse,
)
async def upsert_my_feed_custom_tab(
    payload: FeedCustomTabUpsertRequest,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeedCustomTabResponse:
    """Create or update the signed-in user's custom feed tab."""
    service = _feed_custom_tab_service(db)
    await service.bootstrap_indexes()
    return await service.upsert_for_user(user_id=user.user_id, payload=payload)


# ################################ /ROUTES ################################
