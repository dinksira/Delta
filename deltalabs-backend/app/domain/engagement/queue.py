"""Feed engagement stream publisher and consumer helpers."""

from __future__ import annotations

import json
import logging
from typing import Any

from app.compat.redis_typing import AsyncRedis
from app.core.config import get_settings

logger = logging.getLogger("deltalabs.engagement.queue")


# ################################ QUEUE ################################
async def enqueue_feed_engagement_event(
    redis: AsyncRedis,
    *,
    content_id: str,
    user_id: str,
    action: str,
    payload: dict[str, Any] | None = None,
) -> None:
    """Append engagement event to Redis Stream (best-effort, non-fatal)."""
    settings = get_settings()
    fields = {
        "content_id": content_id,
        "user_id": user_id,
        "action": action,
        "payload": json.dumps(payload or {}, separators=(",", ":"), default=str),
    }
    try:
        await redis.xadd(
            settings.feed_engagement_stream_key,
            fields,
            maxlen=settings.feed_engagement_stream_maxlen,
            approximate=True,
        )
    except Exception:
        logger.exception(
            "feed.engagement.enqueue.failed",
            extra={
                "content_id": content_id,
                "user_id": user_id,
                "action": action,
            },
        )


async def publish_feed_clip_update(
    redis: AsyncRedis,
    *,
    content_id: str,
    user_id: str,
    action: str,
    payload: dict[str, Any] | None = None,
) -> None:
    """Publish realtime clip update directly to Redis Pub/Sub (best-effort)."""
    settings = get_settings()
    channel = f"{settings.feed_engagement_pubsub_channel_prefix}{content_id}"
    message = {
        "content_id": content_id,
        "user_id": user_id,
        "action": action,
        "payload": payload or {},
    }
    try:
        await redis.publish(channel, json.dumps(message, separators=(",", ":"), default=str))
    except Exception:
        logger.exception(
            "feed.engagement.publish.failed",
            extra={
                "content_id": content_id,
                "user_id": user_id,
                "action": action,
                "channel": channel,
            },
        )


async def enqueue_feed_dead_letter_event(
    redis: AsyncRedis,
    *,
    source_stream_id: str,
    content_id: str,
    user_id: str,
    action: str,
    payload: dict[str, Any],
    error: str,
    retry_count: int,
) -> None:
    """Push a failed worker event into dead-letter stream (best-effort)."""
    settings = get_settings()
    fields = {
        "source_stream_id": source_stream_id,
        "content_id": content_id,
        "user_id": user_id,
        "action": action,
        "payload": json.dumps(payload, separators=(",", ":"), default=str),
        "error": error[:500],
        "retry_count": str(retry_count),
    }
    try:
        await redis.xadd(
            settings.feed_engagement_dead_letter_stream_key,
            fields,
            maxlen=settings.feed_engagement_dead_letter_stream_maxlen,
            approximate=True,
        )
    except Exception:
        logger.exception(
            "feed.engagement.dead_letter.enqueue.failed",
            extra={
                "source_stream_id": source_stream_id,
                "content_id": content_id,
                "user_id": user_id,
                "action": action,
            },
        )


def decode_stream_event_fields(fields: dict[str, Any]) -> dict[str, Any]:
    """Normalize Redis stream event payload for workers/realtime fanout."""
    raw_payload = fields.get("payload")
    if isinstance(raw_payload, bytes):
        raw_payload = raw_payload.decode("utf-8")
    payload: dict[str, Any]
    try:
        payload = json.loads(raw_payload) if isinstance(raw_payload, str) and raw_payload else {}
    except json.JSONDecodeError:
        payload = {}
    def _to_str(value: Any) -> str:
        if isinstance(value, bytes):
            return value.decode("utf-8")
        return str(value)
    return {
        "content_id": _to_str(fields.get("content_id", "")),
        "user_id": _to_str(fields.get("user_id", "")),
        "action": _to_str(fields.get("action", "")),
        "payload": payload,
    }


# ################################ /QUEUE ################################
