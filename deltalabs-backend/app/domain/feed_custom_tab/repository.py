"""MongoDB persistence for user custom feed tabs."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING


class Repository:
    """``user_feed_custom_tabs`` — one document per user (MVP)."""

    def __init__(self, db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
        self._db = db

    async def ensure_indexes(self) -> None:
        await self._db["user_feed_custom_tabs"].create_index(
            [("user_id", ASCENDING)],
            name="ix_user_feed_custom_tabs_user_id",
            unique=True,
        )

    async def find_by_user_id(self, *, user_id: str) -> dict[str, Any] | None:
        return await self._db["user_feed_custom_tabs"].find_one({"user_id": user_id})

    async def upsert(
        self,
        *,
        user_id: str,
        label: str,
        filters: dict[str, Any],
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        doc = {
            "user_id": user_id,
            "label": label,
            "filters": filters,
            "updated_at": now,
        }
        await self._db["user_feed_custom_tabs"].update_one(
            {"user_id": user_id},
            {"$set": doc, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )
        stored = await self.find_by_user_id(user_id=user_id)
        if stored is None:
            raise RuntimeError("user_feed_custom_tabs upsert failed")
        return stored
