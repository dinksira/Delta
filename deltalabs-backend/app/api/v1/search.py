"""Global search API (multi-tab, relevance-ranked public discovery)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user_optional, get_db
from app.domain.content.repository import Repository as ContentRepository
from app.domain.content.service import Service as ContentService
from app.domain.identity.repository import Repository as IdentityRepository
from app.domain.search.schemas import GlobalSearchResponse
from app.domain.search.service import SearchService

router = APIRouter(prefix="/search", tags=["search"])


def _search_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> SearchService:
    content_repo = ContentRepository(db)
    content_service = ContentService(content_repo)
    identity_repo = IdentityRepository(db)
    return SearchService(
        content_repository=content_repo,
        content_service=content_service,
        identity_repository=identity_repo,
    )


@router.get("", response_model=GlobalSearchResponse)
async def global_search(
    q: str = Query("", max_length=200, description="Search text"),
    tab: str = Query(
        "top",
        description="Result lens: top | all | users | videos | audio | simulation",
    ),
    limit: int = Query(24, ge=1, le=50),
    user: CurrentUser | None = Depends(get_current_user_optional),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> GlobalSearchResponse:
    """Ranked mixed search across public videos, users, audio, and simulations."""
    service = _search_service(db)
    await service.bootstrap_indexes()
    return await service.global_search(
        q=q,
        tab=tab,
        limit=limit,
        user_id=user.user_id if user is not None else None,
    )
