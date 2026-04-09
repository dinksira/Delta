"""Run continuous feed engagement worker loop.

Usage:
    python scripts/run_feed_worker.py
"""

from __future__ import annotations

import asyncio
import logging

from app.infra.redis_client import connect_redis, disconnect_redis, get_redis_client
from app.jobs.workers import process_feed_engagement_stream_once

logger = logging.getLogger("deltalabs.scripts.feed_worker")


async def _run() -> None:
    await connect_redis()
    redis = get_redis_client()
    logger.warning("feed_worker.start")
    backoff_seconds = 0.1
    max_backoff_seconds = 5.0
    try:
        while True:
            try:
                processed = await process_feed_engagement_stream_once(redis)
                if processed == 0:
                    await asyncio.sleep(0.15)
                backoff_seconds = 0.1
            except Exception:
                logger.exception("feed_worker.loop_error")
                await asyncio.sleep(backoff_seconds)
                backoff_seconds = min(max_backoff_seconds, backoff_seconds * 2)
    finally:
        logger.warning("feed_worker.stop")
        await disconnect_redis()


def main() -> None:
    asyncio.run(_run())


if __name__ == "__main__":
    main()
