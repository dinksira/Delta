"""help_support repository placeholders."""

from __future__ import annotations

from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase


class Repository:
    """MongoDB access layer placeholder for the help_support domain."""

    # ################################ REPOSITORY ################################
    def __init__(self, db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
        self._db = db

    async def ping(self) -> bool:
        """Placeholder connectivity check used by foundation tests."""
        return True


# ################################ /REPOSITORY ################################
