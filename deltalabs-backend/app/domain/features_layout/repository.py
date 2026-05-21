"""MongoDB persistence for per-user Features layout."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING


class Repository:
    """``user_features_layouts`` — one document per user."""

    def __init__(self, db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
        self._db = db

    async def ensure_indexes(self) -> None:
        await self._db["user_features_layouts"].create_index(
            [("user_id", ASCENDING)],
            name="ix_user_features_layouts_user_id",
            unique=True,
        )

    async def find_by_user_id(self, *, user_id: str) -> dict[str, Any] | None:
        return await self._db["user_features_layouts"].find_one({"user_id": user_id})

    async def upsert(
        self,
        *,
        user_id: str,
        order_keys: list[str],
        hidden_keys: list[str],
        labels: dict[str, str],
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        doc = {
            "user_id": user_id,
            "order_keys": order_keys,
            "hidden_keys": hidden_keys,
            "labels": labels,
            "updated_at": now,
        }
        await self._db["user_features_layouts"].update_one(
            {"user_id": user_id},
            {"$set": doc, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )
        stored = await self.find_by_user_id(user_id=user_id)
        if stored is None:
            raise RuntimeError("user_features_layouts upsert failed")
        return stored
