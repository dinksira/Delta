"""Live Duel realtime event publisher (Redis Pub/Sub, best-effort)."""

from __future__ import annotations

import json
import logging
import time
from typing import Any

from app.compat.redis_typing import AsyncRedis
from app.core.config import get_settings

logger = logging.getLogger("deltalabs.live_duels.queue")

# ################################ FANOUT ################################
async def publish_live_duel_update(
    redis: AsyncRedis,
    *,
    room_id: str,
    type: str,
    payload: dict[str, Any],
) -> None:
    """Publish a live-duel room event (question/chat/viewers) to Redis Pub/Sub."""
    settings = get_settings()
    channel = f"{settings.live_duel_pubsub_channel_prefix}{room_id}"
    message = {
        "type": type,
        "room_id": room_id,
        "payload": payload,
        "at": int(time.time() * 1000),
    }
    try:
        await redis.publish(channel, json.dumps(message, separators=(",", ":"), default=str))
    except Exception:
        logger.exception(
            "live_duel.publish.failed",
            extra={"room_id": room_id, "channel": channel, "type": type},
        )


# ################################ /FANOUT ################################