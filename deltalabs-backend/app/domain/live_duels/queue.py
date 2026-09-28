"""Live Duel realtime event publisher (Redis Pub/Sub + presence, best-effort).

The Pub/Sub channel fans room events out to every connected WebSocket. A small
Redis set per room tracks which participants currently hold an open socket so
the WebSocket endpoint can emit accurate `PARTICIPANT_ONLINE` / `PARTICIPANT_
OFFLINE` events without churning the Mongo roster on every reconnect.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any

from app.compat.redis_typing import AsyncRedis
from app.core.config import get_settings

logger = logging.getLogger("deltalabs.live_duels.queue")

ONLINE_PRESENCE_TTL_SECONDS = 30 * 60


def _online_presence_key(room_id: str) -> str:
    settings = get_settings()
    return f"{settings.live_duel_pubsub_channel_prefix}{room_id}:online"


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

# ################################ PRESENCE ################################
async def add_online_participant(
    redis: AsyncRedis,
    *,
    room_id: str,
    user_id: str,
) -> None:
    """Mark a participant as holding an open socket for the room (with TTL)."""
    key = _online_presence_key(room_id)
    try:
        await redis.sadd(key, user_id)
        await redis.expire(key, ONLINE_PRESENCE_TTL_SECONDS)
    except Exception:
        logger.warning(
            "live_duel.presence.sadd_failed",
            extra={"room_id": room_id, "user_id": user_id},
        )


async def remove_online_participant(
    redis: AsyncRedis,
    *,
    room_id: str,
    user_id: str,
) -> None:
    """Clear a participant's open-socket marker (best-effort, disconnected)."""
    try:
        await redis.srem(_online_presence_key(room_id), user_id)
    except Exception:
        logger.warning(
            "live_duel.presence.srem_failed",
            extra={"room_id": room_id, "user_id": user_id},
        )


# ################################ /PRESENCE ################################