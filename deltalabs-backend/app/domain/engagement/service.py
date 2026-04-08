"""Engagement business logic for feed write actions."""

from __future__ import annotations

import hashlib
from typing import Any

from app.compat.redis_typing import AsyncRedis
from app.core.config import get_settings
from app.core.idempotency import replay_or_execute
from app.domain.engagement.repository import Repository
from app.domain.engagement.schemas import (
    CommentCreateRequest,
    CommentCreateResponse,
    EngagementWriteResponse,
    EnrollPlaceholderResponse,
    FeedEventCreateRequest,
    FeedEventCreateResponse,
    ShareCreateResponse,
)

RedisDep = AsyncRedis


# ################################ SERVICE ################################
# Engagement writes with idempotent replay support.
class Service:
    """Engagement writes with idempotent retries."""

    def __init__(self, repository: Repository) -> None:
        self._repository = repository

    async def healthcheck(self) -> bool:
        """Placeholder service method used by foundation tests."""
        return await self._repository.ping()

    async def bootstrap_indexes(self) -> None:
        """Ensure engagement indexes."""
        await self._repository.ensure_indexes()

    async def like(
        self,
        *,
        content_id: str,
        user_id: str,
        redis: RedisDep,
        idempotency_key: str | None,
    ) -> dict[str, Any]:
        settings = get_settings()

        async def run() -> dict[str, Any]:
            await self._repository.assert_public_content(content_id)
            active, count = await self._repository.toggle_like(
                content_id=content_id,
                user_id=user_id,
            )
            return EngagementWriteResponse(
                action="like",
                count=count,
                active=active,
            ).model_dump()

        return await replay_or_execute(
            redis,
            scope=f"like:{user_id}:{content_id}",
            idempotency_key=idempotency_key,
            ttl_seconds=settings.idempotency_ttl_seconds,
            execute=run,
        )

    async def save(
        self,
        *,
        content_id: str,
        user_id: str,
        redis: RedisDep,
        idempotency_key: str | None,
    ) -> dict[str, Any]:
        settings = get_settings()

        async def run() -> dict[str, Any]:
            await self._repository.assert_public_content(content_id)
            active, count = await self._repository.toggle_save(
                content_id=content_id,
                user_id=user_id,
            )
            return EngagementWriteResponse(
                action="save",
                count=count,
                active=active,
            ).model_dump()

        return await replay_or_execute(
            redis,
            scope=f"save:{user_id}:{content_id}",
            idempotency_key=idempotency_key,
            ttl_seconds=settings.idempotency_ttl_seconds,
            execute=run,
        )

    async def comment(
        self,
        *,
        content_id: str,
        user_id: str,
        payload: CommentCreateRequest,
        redis: RedisDep,
        idempotency_key: str | None,
    ) -> dict[str, Any]:
        settings = get_settings()
        body_hash = hashlib.sha256(payload.body.encode("utf-8")).hexdigest()[:24]

        async def run() -> dict[str, Any]:
            await self._repository.assert_public_content(content_id)
            comment_id, count = await self._repository.add_comment(
                content_id=content_id,
                user_id=user_id,
                body=payload.body,
            )
            return CommentCreateResponse(
                comment_id=comment_id,
                count=count,
            ).model_dump()

        return await replay_or_execute(
            redis,
            scope=f"comment:{user_id}:{content_id}:{body_hash}",
            idempotency_key=idempotency_key,
            ttl_seconds=settings.idempotency_ttl_seconds,
            execute=run,
        )

    async def share(
        self,
        *,
        content_id: str,
        user_id: str,
        redis: RedisDep,
        idempotency_key: str | None,
    ) -> dict[str, Any]:
        settings = get_settings()

        async def run() -> dict[str, Any]:
            await self._repository.assert_public_content(content_id)
            count = await self._repository.add_share(
                content_id=content_id,
                user_id=user_id,
            )
            return ShareCreateResponse(count=count).model_dump()

        return await replay_or_execute(
            redis,
            scope=f"share:{user_id}:{content_id}",
            idempotency_key=idempotency_key,
            ttl_seconds=settings.idempotency_ttl_seconds,
            execute=run,
        )

    async def enroll_placeholder(self, *, content_id: str) -> dict[str, Any]:
        """Stable placeholder until Course enrollment exists."""
        await self._repository.assert_public_content(content_id)
        return EnrollPlaceholderResponse().model_dump()

    async def feed_event(
        self,
        *,
        content_id: str,
        user_id: str,
        payload: FeedEventCreateRequest,
        redis: RedisDep,
        idempotency_key: str | None,
    ) -> dict[str, Any]:
        """Capture user telemetry events used for feed ranking helpers."""
        settings = get_settings()

        async def run() -> dict[str, Any]:
            await self._repository.assert_public_content(content_id)
            await self._repository.add_feed_event(
                content_id=content_id,
                user_id=user_id,
                event=payload.event,
                watch_ms=payload.watch_ms,
                position_ms=payload.position_ms,
            )
            return FeedEventCreateResponse(event=payload.event).model_dump()

        return await replay_or_execute(
            redis,
            scope=f"event:{user_id}:{content_id}:{payload.event}",
            idempotency_key=idempotency_key,
            ttl_seconds=settings.idempotency_ttl_seconds,
            execute=run,
        )


# ################################ /SERVICE ################################
