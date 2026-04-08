from __future__ import annotations

from fastapi import APIRouter, Depends, Header, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_current_user_optional, get_db, get_redis
from app.compat.redis_typing import AsyncRedis
from app.domain.content.repository import Repository as ContentRepository
from app.domain.content.schemas import FeedItemPublic, FeedPaginatedResponse
from app.domain.content.service import Service as ContentService
from app.domain.engagement.repository import Repository as EngagementRepository
from app.domain.engagement.schemas import (
    CommentCreateRequest,
    CommentCreateResponse,
    EngagementWriteResponse,
    EnrollPlaceholderResponse,
    ShareCreateResponse,
)
from app.domain.engagement.service import Service as EngagementService

# ################################ CONSTANTS ################################
# Router and dependency aliases for feed and engagement APIs.
router = APIRouter(prefix="/feed", tags=["feed"])

RedisDep = AsyncRedis
# ################################ /CONSTANTS ################################


# ################################ HELPERS ################################
# Internal service constructors.
def _content_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> ContentService:
    return ContentService(ContentRepository(db))


def _engagement_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> EngagementService:
    return EngagementService(EngagementRepository(db))


# ################################ /HELPERS ################################


# ################################ ROUTES ################################
# Feed read and engagement write endpoints.
@router.get("", response_model=FeedPaginatedResponse)
async def get_feed(
    limit: int = Query(12, ge=1, le=50),
    cursor: str | None = Query(None),
    content_type: str | None = Query(None, description="Optional filter, e.g. video"),
    user: CurrentUser | None = Depends(get_current_user_optional),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeedPaginatedResponse:
    """Public landing feed with cursor pagination."""
    service = _content_service(db)
    await service.bootstrap_indexes()
    return await service.list_feed(
        limit=limit,
        cursor_token=cursor,
        content_type=content_type,
        user_id=user.user_id if user is not None else None,
    )


@router.post("/{item_id}/like", response_model=EngagementWriteResponse)
async def feed_like(
    item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> EngagementWriteResponse:
    """Toggle like on a feed item (requires session)."""
    service = _engagement_service(db)
    await service.bootstrap_indexes()
    data = await service.like(
        content_id=item_id,
        user_id=user.user_id,
        redis=redis,
        idempotency_key=idempotency_key,
    )
    return EngagementWriteResponse.model_validate(data)


@router.post("/{item_id}/save", response_model=EngagementWriteResponse)
async def feed_save(
    item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> EngagementWriteResponse:
    """Toggle save/favorite on a feed item (requires session)."""
    service = _engagement_service(db)
    await service.bootstrap_indexes()
    data = await service.save(
        content_id=item_id,
        user_id=user.user_id,
        redis=redis,
        idempotency_key=idempotency_key,
    )
    return EngagementWriteResponse.model_validate(data)


@router.post("/{item_id}/comment", response_model=CommentCreateResponse)
async def feed_comment(
    item_id: str,
    payload: CommentCreateRequest,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> CommentCreateResponse:
    """Post a comment on a feed item (requires session)."""
    service = _engagement_service(db)
    await service.bootstrap_indexes()
    data = await service.comment(
        content_id=item_id,
        user_id=user.user_id,
        payload=payload,
        redis=redis,
        idempotency_key=idempotency_key,
    )
    return CommentCreateResponse.model_validate(data)


@router.post("/{item_id}/share", response_model=ShareCreateResponse)
async def feed_share(
    item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> ShareCreateResponse:
    """Record a share event for a feed item (requires session)."""
    service = _engagement_service(db)
    await service.bootstrap_indexes()
    data = await service.share(
        content_id=item_id,
        user_id=user.user_id,
        redis=redis,
        idempotency_key=idempotency_key,
    )
    return ShareCreateResponse.model_validate(data)


@router.post("/{item_id}/enroll", response_model=EnrollPlaceholderResponse)
async def feed_enroll(
    item_id: str,
    _user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> EnrollPlaceholderResponse:
    """Placeholder enroll CTA from feed (requires session)."""
    service = _engagement_service(db)
    await service.bootstrap_indexes()
    data = await service.enroll_placeholder(content_id=item_id)
    return EnrollPlaceholderResponse.model_validate(data)


@router.get("/{item_id}", response_model=FeedItemPublic)
async def get_feed_item(
    item_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeedItemPublic:
    """Single feed item by id."""
    service = _content_service(db)
    await service.bootstrap_indexes()
    return await service.get_feed_item(item_id)


# ################################ /ROUTES ################################
