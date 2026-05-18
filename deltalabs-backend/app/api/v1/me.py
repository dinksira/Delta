"""User-centric (`/me`) aggregates."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_db
from app.domain.feed_custom_tab.repository import Repository as FeedCustomTabRepository
from app.domain.feed_custom_tab.schemas import FeedCustomTabResponse, FeedCustomTabUpsertRequest
from app.domain.feed_custom_tab.service import Service as FeedCustomTabService
from fastapi import APIRouter, Depends, File, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_db
from app.domain.identity.repository import Repository as IdentityRepository
from app.domain.identity.schemas import AuthUserPublic, UserProfileUpdate, UserPasswordChange
from app.domain.identity.service import Service as IdentityService
from app.domain.school.repository import Repository as SchoolRepository
from app.domain.school.schemas import MySchoolsResponse
from app.domain.school.service import Service as SchoolService

# ################################ CONSTANTS ################################
router = APIRouter(prefix="/me", tags=["me"])
# ################################ /CONSTANTS ################################


# ################################ HELPERS ################################
def _school_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> SchoolService:
    return SchoolService(SchoolRepository(db))


def _feed_custom_tab_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> FeedCustomTabService:
    return FeedCustomTabService(FeedCustomTabRepository(db))
def _identity_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> IdentityService:
    return IdentityService(IdentityRepository(db))


# ################################ /HELPERS ################################


# ################################ ROUTES ################################
@router.get("/profile", response_model=AuthUserPublic)
async def get_my_profile(
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> AuthUserPublic:
    """Fetch the current authenticated user's profile."""
    service = _identity_service(db)
    return await service.get_profile(user_id=user.user_id)


@router.patch("/profile", response_model=AuthUserPublic)
async def update_my_profile(
    payload: UserProfileUpdate,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> AuthUserPublic:
    """Update current user profile fields."""
    service = _identity_service(db)
    return await service.update_profile(user_id=user.user_id, payload=payload)


@router.post("/avatar", response_model=AuthUserPublic)
async def upload_my_avatar(
    file: UploadFile = File(...),
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> AuthUserPublic:
    """Upload and set user avatar. Mocking storage URL for now."""
    # In a real app, we'd save to S3 or a local disk and return the public URL.
    # For this demo/task, we'll simulate the URL.
    service = _identity_service(db)
    mock_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.user_id}&backgroundColor=b6e3f4"
    return await service.update_avatar(user_id=user.user_id, avatar_url=mock_url)


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
@router.delete("/profile")
async def delete_my_profile(
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> dict[str, bool]:
    """Permanently delete the current user's account and all data."""
    service = _identity_service(db)
    success = await service.delete_account(user_id=user.user_id)
    return {"success": success}


@router.patch("/password")
async def change_my_password(
    payload: UserPasswordChange,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> dict[str, bool]:
    """Verify current password and update to new password."""
    service = _identity_service(db)
    success = await service.change_password(user_id=user.user_id, payload=payload)
    return {"success": success}


# ################################ /ROUTES ################################
