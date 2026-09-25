"""Background launch loop for scheduled topic battles.

Flips scheduled battles whose `countdown_ends_at` has passed into the joinable
`filling` state so the lobby stays honest without any request-time coupling.
Runs as a lightweight asyncio task owned by the app lifespan.
"""

from __future__ import annotations

import asyncio
import logging

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.domain.competitions.repository import Repository as CompetitionsRepository
from app.domain.competitions.service import Service as CompetitionsService

logger = logging.getLogger("deltalabs.jobs.launchers")

LAUNCHER_INTERVAL_SECONDS = 30


# ################################ LAUNCHERS ################################
async def launch_due_scheduled_battles_once(db) -> int:
    """Flip battles past their scheduled launch time; returns the count flipped."""
    service = CompetitionsService(CompetitionsRepository(db))
    launched = await service.launch_due_scheduled_battles()
    return launched


async def run_scheduled_battle_launcher(
    db: AsyncIOMotorDatabase[dict[str, object]],
    *,
    interval_seconds: int = LAUNCHER_INTERVAL_SECONDS,
) -> None:
    """Periodic launcher task; never raises (loop keeps running on failures)."""
    while True:
        try:
            launched = await launch_due_scheduled_battles_once(db)
            if launched:
                logger.info("launcher.topic_battles.launched", extra={"count": launched})
        except Exception as exc:
            logger.warning("launcher.topic_battles.failed", extra={"error": str(exc)})
        await asyncio.sleep(interval_seconds)


# ################################ /LAUNCHERS ################################