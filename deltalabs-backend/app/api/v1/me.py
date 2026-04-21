"""User-centric (`/me`) aggregates."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_db
from app.domain.school.repository import Repository as SchoolRepository
from app.domain.school.schemas import MySchoolsResponse
from app.domain.school.service import Service as SchoolService

# ################################ CONSTANTS ################################
router = APIRouter(prefix="/me", tags=["me"])
# ################################ /CONSTANTS ################################


def _school_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> SchoolService:
    return SchoolService(SchoolRepository(db))


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


# ################################ /ROUTES ################################
