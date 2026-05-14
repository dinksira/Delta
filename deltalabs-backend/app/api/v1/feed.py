from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, Depends, Header, Query
from fastapi import HTTPException
from fastapi import WebSocket
from fastapi import WebSocketDisconnect
from fastapi import status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_current_user_optional, get_db, get_redis
from app.compat.redis_typing import AsyncRedis
from app.core.config import get_settings
from app.core.security import hash_session_token
from app.domain.content.repository import Repository as ContentRepository
from app.domain.content.schemas import FeedItemPublic, FeedPaginatedResponse
from app.domain.content.service import Service as ContentService
from app.domain.engagement.repository import Repository as EngagementRepository
from app.domain.engagement.queue import enqueue_feed_engagement_event, publish_feed_clip_update
from app.domain.engagement.schemas import (
    CommentCreateRequest,
    CommentCreateResponse,
    EngagementWriteResponse,
    EnrollPlaceholderResponse,
    FeedCommentListResponse,
    FeedEventCreateRequest,
    FeedEventCreateResponse,
    FeedTelemetrySummaryResponse,
    ShareCreateResponse,
)
from app.domain.engagement.service import Service as EngagementService
from app.domain.identity.repository import Repository as IdentityRepository
from app.jobs.workers import WorkerHealthUnavailable, get_worker_lag_snapshot

# ################################ CONSTANTS ################################
# Router and dependency aliases for feed and engagement APIs.
router = APIRouter(prefix="/feed", tags=["feed"])
logger = logging.getLogger("deltalabs.api.feed")

RedisDep = AsyncRedis
# ################################ /CONSTANTS ################################


# ################################ HELPERS ################################
# Internal service constructors.
def _content_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> ContentService:
    return ContentService(ContentRepository(db))


def _engagement_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> EngagementService:
    return EngagementService(EngagementRepository(db))


# ################################ /HELPERS ################################

_FEED_COURSE_CATEGORIES = frozenset({"research", "lab", "course"})


def _normalize_feed_course_category(raw: str | None) -> str | None:
    if raw is None or not str(raw).strip():
        return None
    value = str(raw).strip().lower()
    if value not in _FEED_COURSE_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "feed_course_category_invalid", "allowed": sorted(_FEED_COURSE_CATEGORIES)},
        )
    return value


# ################################ ROUTES ################################
# Feed read and engagement write endpoints.
@router.get("", response_model=FeedPaginatedResponse)
async def get_feed(
    limit: int = Query(12, ge=1, le=50),
    cursor: str | None = Query(None),
    content_type: str | None = Query(None, description="Optional filter, e.g. video"),
    hashtag: str | None = Query(None, max_length=120, description="Match any hashtag (substring, case-insensitive)"),
    min_duration_s: int | None = Query(None, ge=0, le=86_400),
    max_duration_s: int | None = Query(None, ge=0, le=86_400),
    course_category: str | None = Query(None, description="One of: research, lab, course"),
    user: CurrentUser | None = Depends(get_current_user_optional),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeedPaginatedResponse:
    """Public landing feed with cursor pagination."""
    if (
        min_duration_s is not None
        and max_duration_s is not None
        and min_duration_s > max_duration_s
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "feed_duration_range_invalid", "message": "min_duration_s must be <= max_duration_s"},
        )
    course = _normalize_feed_course_category(course_category)
    service = _content_service(db)
    await service.bootstrap_indexes()
    return await service.list_feed(
        limit=limit,
        cursor_token=cursor,
        content_type=content_type,
        user_id=user.user_id if user is not None else None,
        hashtag=hashtag,
        min_duration_s=min_duration_s,
        max_duration_s=max_duration_s,
        course_category=course,
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
    await enqueue_feed_engagement_event(
        redis,
        content_id=item_id,
        user_id=user.user_id,
        action="like_toggled",
        payload={
            "count": int(data.get("count", 0)),
            "active": bool(data.get("active", False)),
        },
    )
    await publish_feed_clip_update(
        redis,
        content_id=item_id,
        user_id=user.user_id,
        action="like_toggled",
        payload={
            "count": int(data.get("count", 0)),
            "active": bool(data.get("active", False)),
        },
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
    await enqueue_feed_engagement_event(
        redis,
        content_id=item_id,
        user_id=user.user_id,
        action="save_toggled",
        payload={
            "count": int(data.get("count", 0)),
            "active": bool(data.get("active", False)),
        },
    )
    await publish_feed_clip_update(
        redis,
        content_id=item_id,
        user_id=user.user_id,
        action="save_toggled",
        payload={
            "count": int(data.get("count", 0)),
            "active": bool(data.get("active", False)),
        },
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
    await enqueue_feed_engagement_event(
        redis,
        content_id=item_id,
        user_id=user.user_id,
        action="comment_created",
        payload={
            "comment_id": str(data.get("comment_id", "")),
            "count": int(data.get("count", 0)),
        },
    )
    await publish_feed_clip_update(
        redis,
        content_id=item_id,
        user_id=user.user_id,
        action="comment_created",
        payload={
            "comment_id": str(data.get("comment_id", "")),
            "count": int(data.get("count", 0)),
        },
    )
    return CommentCreateResponse.model_validate(data)


@router.get("/{item_id}/comments", response_model=FeedCommentListResponse)
async def feed_comments(
    item_id: str,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeedCommentListResponse:
    """List latest comments for a feed item."""
    service = _engagement_service(db)
    await service.bootstrap_indexes()
    data = await service.list_comments(content_id=item_id, limit=limit)
    return FeedCommentListResponse.model_validate(data)


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
    await enqueue_feed_engagement_event(
        redis,
        content_id=item_id,
        user_id=user.user_id,
        action="shared",
        payload={"count": int(data.get("count", 0))},
    )
    await publish_feed_clip_update(
        redis,
        content_id=item_id,
        user_id=user.user_id,
        action="shared",
        payload={"count": int(data.get("count", 0))},
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


@router.post("/{item_id}/event", response_model=FeedEventCreateResponse)
async def feed_event(
    item_id: str,
    payload: FeedEventCreateRequest,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> FeedEventCreateResponse:
    """Record feed telemetry events used for ranking helpers."""
    service = _engagement_service(db)
    await service.bootstrap_indexes()
    data = await service.feed_event(
        content_id=item_id,
        user_id=user.user_id,
        payload=payload,
        redis=redis,
        idempotency_key=idempotency_key,
    )
    await enqueue_feed_engagement_event(
        redis,
        content_id=item_id,
        user_id=user.user_id,
        action="telemetry_event",
        payload={
            "event": payload.event,
            "watch_ms": payload.watch_ms,
            "position_ms": payload.position_ms,
        },
    )
    await publish_feed_clip_update(
        redis,
        content_id=item_id,
        user_id=user.user_id,
        action="telemetry_event",
        payload={
            "event": payload.event,
            "watch_ms": payload.watch_ms,
            "position_ms": payload.position_ms,
        },
    )
    return FeedEventCreateResponse.model_validate(data)


@router.get("/telemetry/summary", response_model=FeedTelemetrySummaryResponse)
async def feed_telemetry_summary(
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> FeedTelemetrySummaryResponse:
    """Read compact feed telemetry observability summary."""
    service = _engagement_service(db)
    await service.bootstrap_indexes()
    data = await service.feed_telemetry_summary()
    return FeedTelemetrySummaryResponse.model_validate(data)


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


@router.websocket("/ws")
async def feed_ws(
    websocket: WebSocket,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
) -> None:
    """Realtime feed engagement updates (authenticated clip subscriptions)."""
    settings = get_settings()
    access_token = (websocket.query_params.get("access_token") or "").strip()
    if not access_token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing access token.")
        return
    identity_repository = IdentityRepository(db)
    session_doc = await identity_repository.find_session_by_token_hash(hash_session_token(access_token))
    if session_doc is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid session.")
        return

    clip_ids_raw = websocket.query_params.get("clip_ids", "")
    requested_clip_ids = [chunk.strip() for chunk in clip_ids_raw.split(",") if chunk.strip()]
    if len(requested_clip_ids) > 100:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Too many clip ids.")
        return
    content_repository = ContentRepository(db)
    clip_filter: set[str] = set()
    for clip_id in requested_clip_ids:
        doc = await content_repository.find_public_by_id(clip_id)
        if doc is not None:
            clip_filter.add(clip_id)
    if requested_clip_ids and not clip_filter:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="No permitted clip ids.")
        return

    channel_pattern = f"{settings.feed_engagement_pubsub_channel_prefix}*"
    pubsub = redis.pubsub()
    await websocket.accept()
    try:
        await pubsub.psubscribe(channel_pattern)
    except Exception as exc:
        logger.warning("feed.ws.redis_unavailable", extra={"error": str(exc)})
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Realtime backend unavailable.")
        await pubsub.aclose()
        return
    try:
        while True:
            try:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            except Exception as exc:
                logger.warning("feed.ws.redis_read_failed", extra={"error": str(exc)})
                await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Realtime backend unavailable.")
                return
            if not message:
                await asyncio.sleep(0.1)
                continue
            raw_data = message.get("data")
            if isinstance(raw_data, bytes):
                raw_data = raw_data.decode("utf-8")
            if not isinstance(raw_data, str) or not raw_data:
                continue
            try:
                payload = json.loads(raw_data)
            except json.JSONDecodeError:
                continue
            content_id = str(payload.get("content_id", "")).strip()
            if clip_filter and content_id not in clip_filter:
                continue
            await websocket.send_json(payload)
    except WebSocketDisconnect:
        return
    finally:
        try:
            await pubsub.punsubscribe(channel_pattern)
        finally:
            await pubsub.aclose()


@router.get("/worker/health")
async def feed_worker_health(
    _user: CurrentUser = Depends(get_current_user),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
) -> dict[str, int | str | None]:
    """Worker lag and queue health snapshot for feed engagement pipeline."""
    try:
        return await get_worker_lag_snapshot(redis)
    except WorkerHealthUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "redis_unavailable",
                "message": str(exc),
            },
        ) from exc
