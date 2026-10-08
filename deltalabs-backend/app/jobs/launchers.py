"""Background job loop for scheduled content and abandoned-state cleanup.

One lightweight asyncio task (owned by the app lifespan) periodically:
- flips scheduled topic battles / live duels whose start has passed to joinable,
- auto-completes topic battles stuck in `filling` too long with no takers,
- finishes live-duel rooms abandoned (silent past a TTL) so they surface in
  history instead of showing as forever-"live".

All mutations run best-effort: a failing pass logs a warning and the loop keeps
ticking, so a single bad document can never take the process down.
"""

from __future__ import annotations

import asyncio
import logging
from time import time

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.compat.redis_typing import AsyncRedis
from app.domain.competitions.repository import Repository as CompetitionsRepository
from app.domain.competitions.service import Service as CompetitionsService
from app.domain.live_duels import queue as live_duels_queue
from app.domain.live_duels.repository import (
    STALE_LIVE_ROOM_TTL_SECONDS,
)
from app.domain.live_duels.repository import (
    Repository as LiveDuelRepository,
)

logger = logging.getLogger("deltalabs.jobs.launchers")

LAUNCHER_INTERVAL_SECONDS = 30
# A filling topic battle whose last activity is older than this is a no-show for
# a scheduled run; the launcher cancels it so the lobby does not show dead never-
# starting battles forever.
STALE_FILLING_BATTLE_TTL_SECONDS = 24 * 60 * 60


# ################################ LAUNCHERS ################################
async def launch_due_scheduled_battles_once(db) -> int:
    """Flip topic battles past their scheduled launch time; returns the count."""
    service = CompetitionsService(CompetitionsRepository(db))
    return await service.launch_due_scheduled_battles()


async def launch_due_scheduled_duels_once(db) -> int:
    """Flip live duels past their scheduled start to `live`; returns the count."""
    repository = LiveDuelRepository(db)
    due = await repository.find_due_scheduled_duels(int(time() * 1000))
    launched = 0
    for doc in due:
        room_id = str(doc.get("_id"))
        if not room_id:
            continue
        updated = await repository.mark_scheduled_live(room_id)
        if updated is not None:
            launched += 1
    return launched


async def sweep_stale_filling_battles_once(db) -> int:
    """Cancel filling topic battles with no activity for the TTL; returns the count."""
    from datetime import UTC, datetime, timedelta

    cutoff = datetime.now(UTC) - timedelta(seconds=STALE_FILLING_BATTLE_TTL_SECONDS)
    service = CompetitionsService(CompetitionsRepository(db))
    return await service.sweep_stale_filling_battles(cutoff)


async def sweep_stale_live_duels_once(db, redis: AsyncRedis) -> int:
    """Finish live duels silent past the TTL; publishes `DUEL_ENDED` per room."""
    repository = LiveDuelRepository(db)
    now_ms = int(time() * 1000)
    stale = await repository.find_stale_live_rooms(now_ms, STALE_LIVE_ROOM_TTL_SECONDS)
    swept = 0
    for doc in stale:
        room_id = str(doc.get("_id"))
        if not room_id:
            continue
        updated, transitioned = await repository.mark_finished(
            room_id, final_leaderboard=[], winner_name=None
        )
        if updated is None or not transitioned:
            continue
        await live_duels_queue.publish_live_duel_update(
            redis,
            room_id=room_id,
            type="DUEL_ENDED",
            payload={
                "reason": "abandoned",
                "finalLeaderboard": [],
                "winnerName": None,
                "finishedAt": updated.get("finished_at") or None,
            },
        )
        swept += 1
    return swept


async def run_competition_jobs(
    db: AsyncIOMotorDatabase[dict[str, object]],
    redis: AsyncRedis,
    *,
    interval_seconds: int = LAUNCHER_INTERVAL_SECONDS,
) -> None:
    """Periodic job task; never raises (loop keeps running on failures)."""
    while True:
        try:
            launched = await launch_due_scheduled_battles_once(db)
            if launched:
                logger.info("launcher.topic_battles.launched", extra={"count": launched})
        except Exception as exc:
            logger.warning("launcher.topic_battles.failed", extra={"error": str(exc)})
        try:
            launched = await launch_due_scheduled_duels_once(db)
            if launched:
                logger.info("launcher.live_duels.launched", extra={"count": launched})
        except Exception as exc:
            logger.warning("launcher.live_duels.failed", extra={"error": str(exc)})
        try:
            cancelled = await sweep_stale_filling_battles_once(db)
            if cancelled:
                logger.info("launcher.topic_battles.cancelled", extra={"count": cancelled})
        except Exception as exc:
            logger.warning("launcher.topic_battles.sweep_failed", extra={"error": str(exc)})
        try:
            swept = await sweep_stale_live_duels_once(db, redis)
            if swept:
                logger.info("launcher.live_duels.abandoned_finished", extra={"count": swept})
        except Exception as exc:
            logger.warning("launcher.live_duels.sweep_failed", extra={"error": str(exc)})
        await asyncio.sleep(interval_seconds)


# ################################ /LAUNCHERS ################################