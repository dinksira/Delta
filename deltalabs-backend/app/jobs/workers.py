"""Background worker helpers for feed engagement stream fanout."""

from __future__ import annotations

import json
import logging

from app.compat.redis_typing import AsyncRedis
from app.core.config import get_settings
from app.domain.engagement.queue import decode_stream_event_fields, enqueue_feed_dead_letter_event

logger = logging.getLogger("deltalabs.jobs.workers")

WORKER_CURSOR_KEY = "feed:engagement:worker:last_id"
WORKER_PROCESSED_TOTAL_KEY = "feed:engagement:worker:processed_total"
WORKER_LAST_PROCESSED_AT_KEY = "feed:engagement:worker:last_processed_at"


class WorkerHealthUnavailable(RuntimeError):
    """Raised when worker health metrics cannot be read from Redis."""


# ################################ WORKERS ################################
def worker_health() -> dict[str, str]:
    """Return worker baseline status for smoke/integration checks."""
    return {"status": "stream_fanout_ready"}


async def process_feed_engagement_stream_once(redis: AsyncRedis) -> int:
    """Consume pending stream events and publish clip-level realtime fanout."""
    settings = get_settings()
    last_id = await redis.get(WORKER_CURSOR_KEY)
    stream_id = last_id if isinstance(last_id, str) and last_id else "0-0"
    try:
        rows = await redis.xread(
            {settings.feed_engagement_stream_key: stream_id},
            count=100,
            block=1,
        )
    except Exception:
        logger.exception("feed.worker.xread.failed")
        return 0
    if not rows:
        return 0

    processed = 0
    for _stream_key, entries in rows:
        for entry_id, fields in entries:
            normalized = decode_stream_event_fields(fields)
            clip_id = str(normalized.get("content_id", "")).strip()
            action = str(normalized.get("action", "")).strip()
            user_id = str(normalized.get("user_id", "")).strip()
            payload = normalized.get("payload")
            if not isinstance(payload, dict):
                payload = {}
            retry_count_raw = payload.get("retry_count")
            retry_count = int(retry_count_raw) if isinstance(retry_count_raw, int | str) and str(retry_count_raw).isdigit() else 0
            try:
                if clip_id:
                    channel = f"{settings.feed_engagement_pubsub_channel_prefix}{clip_id}"
                    await redis.publish(channel, json.dumps(normalized, separators=(",", ":"), default=str))
                await redis.set(WORKER_CURSOR_KEY, entry_id)
                await redis.incr(WORKER_PROCESSED_TOTAL_KEY)
                await redis.set(WORKER_LAST_PROCESSED_AT_KEY, entry_id.split("-")[0])
                processed += 1
            except Exception as exc:
                logger.exception("feed.worker.publish.failed", extra={"entry_id": entry_id, "clip_id": clip_id})
                next_retry_count = retry_count + 1
                if next_retry_count >= settings.feed_worker_max_retries:
                    await enqueue_feed_dead_letter_event(
                        redis,
                        source_stream_id=entry_id,
                        content_id=clip_id,
                        user_id=user_id,
                        action=action,
                        payload=payload,
                        error=str(exc),
                        retry_count=next_retry_count,
                    )
                else:
                    payload["retry_count"] = next_retry_count
                    payload["retry_error"] = str(exc)[:200]
                    await redis.xadd(
                        settings.feed_engagement_stream_key,
                        {
                            "content_id": clip_id,
                            "user_id": user_id,
                            "action": action,
                            "payload": json.dumps(payload, separators=(",", ":"), default=str),
                        },
                        maxlen=settings.feed_engagement_stream_maxlen,
                        approximate=True,
                    )
                    await enqueue_feed_dead_letter_event(
                        redis,
                        source_stream_id=entry_id,
                        content_id=clip_id,
                        user_id=user_id,
                        action=f"{action}.retry_enqueued",
                        payload=payload,
                        error=str(exc),
                        retry_count=next_retry_count,
                    )
                await redis.set(WORKER_CURSOR_KEY, entry_id)
    return processed


async def get_worker_lag_snapshot(redis: AsyncRedis) -> dict[str, int | str | None]:
    """Compute worker cursor/lag snapshot for observability endpoints."""
    settings = get_settings()
    try:
        stream_length = int(await redis.xlen(settings.feed_engagement_stream_key))
        dead_letter_length = int(await redis.xlen(settings.feed_engagement_dead_letter_stream_key))
        cursor = await redis.get(WORKER_CURSOR_KEY)
        processed_total_raw = await redis.get(WORKER_PROCESSED_TOTAL_KEY)
        processed_total = int(processed_total_raw) if isinstance(processed_total_raw, str) and processed_total_raw.isdigit() else 0
        if isinstance(cursor, str) and cursor:
            lag_sample = await redis.xrange(
                settings.feed_engagement_stream_key,
                min=f"({cursor}",
                max="+",
                count=10_000,
            )
            lag_approx = len(lag_sample)
            lag_is_lower_bound = lag_approx == 10_000
        else:
            lag_approx = stream_length
            lag_is_lower_bound = False
        last_processed_at = await redis.get(WORKER_LAST_PROCESSED_AT_KEY)
        return {
            "stream_length": stream_length,
            "dead_letter_length": dead_letter_length,
            "processed_total": processed_total,
            "worker_cursor": cursor if isinstance(cursor, str) else None,
            "last_processed_at_ms": int(last_processed_at) if isinstance(last_processed_at, str) and last_processed_at.isdigit() else None,
            "lag_approx": lag_approx,
            "lag_is_lower_bound": int(lag_is_lower_bound),
        }
    except Exception as exc:
        logger.warning("feed.worker.health.unavailable", extra={"error": str(exc)})
        raise WorkerHealthUnavailable("Redis unavailable for worker health snapshot") from exc


# ################################ /WORKERS ################################
