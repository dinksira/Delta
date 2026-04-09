"""Engagement repository (MongoDB) for likes, saves, comments, shares."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING

from app.domain.content.repository import Repository as ContentRepository


class Repository:
    """Persist engagement rows and counts for feed items."""

    # ################################ REPOSITORY ################################
    def __init__(self, db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
        self._db = db
        self._content = ContentRepository(db)

    async def ping(self) -> bool:
        """Connectivity check used by foundation tests."""
        return True

    async def ensure_indexes(self) -> None:
        """Indexes for engagement collections."""
        await self._db["content_likes"].create_index(
            [("content_id", ASCENDING), ("user_id", ASCENDING)],
            unique=True,
            name="uq_content_likes_content_user",
        )
        await self._db["content_saves"].create_index(
            [("content_id", ASCENDING), ("user_id", ASCENDING)],
            unique=True,
            name="uq_content_saves_content_user",
        )
        await self._db["content_comments"].create_index(
            [("content_id", ASCENDING), ("created_at", ASCENDING)],
            name="ix_content_comments_content_created",
        )
        await self._db["content_shares"].create_index(
            [("content_id", ASCENDING), ("created_at", ASCENDING)],
            name="ix_content_shares_content_created",
        )
        await self._db["content_events"].create_index(
            [("user_id", ASCENDING), ("created_at", ASCENDING)],
            name="ix_content_events_user_created",
        )
        await self._db["content_events"].create_index(
            [("content_id", ASCENDING), ("event", ASCENDING), ("created_at", ASCENDING)],
            name="ix_content_events_content_event_created",
        )

    async def assert_public_content(self, content_id: str) -> None:
        """Ensure the feed item exists and is public."""
        doc = await self._content.find_public_by_id(content_id)
        if doc is None:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Feed item not found.", code="feed_item_not_found")

    async def toggle_like(self, *, content_id: str, user_id: str) -> tuple[bool, int]:
        """Toggle like; return (active after toggle, total like count)."""
        now = datetime.now(UTC)
        existing = await self._db["content_likes"].find_one(
            {"content_id": content_id, "user_id": user_id},
        )
        if existing is not None:
            await self._db["content_likes"].delete_one({"_id": existing["_id"]})
            active = False
        else:
            await self._db["content_likes"].insert_one(
                {
                    "_id": str(uuid4()),
                    "content_id": content_id,
                    "user_id": user_id,
                    "created_at": now,
                },
            )
            active = True
        count = int(await self._db["content_likes"].count_documents({"content_id": content_id}))
        return active, count

    async def toggle_save(self, *, content_id: str, user_id: str) -> tuple[bool, int]:
        """Toggle save/favorite; return (active, total saves)."""
        now = datetime.now(UTC)
        existing = await self._db["content_saves"].find_one(
            {"content_id": content_id, "user_id": user_id},
        )
        if existing is not None:
            await self._db["content_saves"].delete_one({"_id": existing["_id"]})
            active = False
        else:
            await self._db["content_saves"].insert_one(
                {
                    "_id": str(uuid4()),
                    "content_id": content_id,
                    "user_id": user_id,
                    "created_at": now,
                },
            )
            active = True
        count = int(await self._db["content_saves"].count_documents({"content_id": content_id}))
        return active, count

    async def add_comment(self, *, content_id: str, user_id: str, body: str) -> tuple[str, int]:
        """Append comment; return (comment_id, total comments for item)."""
        now = datetime.now(UTC)
        comment_id = str(uuid4())
        await self._db["content_comments"].insert_one(
            {
                "_id": comment_id,
                "content_id": content_id,
                "user_id": user_id,
                "body": body,
                "created_at": now,
            },
        )
        count = int(await self._db["content_comments"].count_documents({"content_id": content_id}))
        return comment_id, count

    async def list_comments(
        self,
        *,
        content_id: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        """List latest comments for a feed item."""
        return await (
            self._db["content_comments"]
            .find({"content_id": content_id})
            .sort([("created_at", -1)])
            .limit(limit)
            .to_list(length=limit)
        )

    async def add_share(self, *, content_id: str, user_id: str) -> int:
        """Record a share event; return total share count for item."""
        now = datetime.now(UTC)
        await self._db["content_shares"].insert_one(
            {
                "_id": str(uuid4()),
                "content_id": content_id,
                "user_id": user_id,
                "created_at": now,
            },
        )
        return int(await self._db["content_shares"].count_documents({"content_id": content_id}))

    async def add_feed_event(
        self,
        *,
        content_id: str,
        user_id: str,
        event: str,
        watch_ms: int | None,
        position_ms: int | None,
    ) -> str:
        """Record feed telemetry events for ranking signals."""
        now = datetime.now(UTC)
        event_id = str(uuid4())
        await self._db["content_events"].insert_one(
            {
                "_id": event_id,
                "content_id": content_id,
                "user_id": user_id,
                "event": event,
                "watch_ms": watch_ms,
                "position_ms": position_ms,
                "created_at": now,
            },
        )
        return event_id

    async def get_feed_event_counts(self) -> dict[str, int]:
        """Event totals grouped by event name."""
        rows = (
            await self._db["content_events"]
            .aggregate(
                [
                    {"$group": {"_id": "$event", "count": {"$sum": 1}}},
                ]
            )
            .to_list(length=50)
        )
        result: dict[str, int] = {}
        for row in rows:
            key = str(row.get("_id", "")).strip()
            if key:
                result[key] = int(row.get("count", 0))
        return result

    async def get_feed_unique_user_count(self) -> int:
        """Distinct user count for feed telemetry events."""
        values = await self._db["content_events"].distinct("user_id")
        return len([value for value in values if value])

    async def get_feed_average_watch_ms(self) -> int:
        """Average watch milliseconds across rows with watch_ms."""
        rows = (
            await self._db["content_events"]
            .aggregate(
                [
                    {"$match": {"watch_ms": {"$type": "number"}}},
                    {"$group": {"_id": None, "avg": {"$avg": "$watch_ms"}}},
                ]
            )
            .to_list(length=1)
        )
        if not rows:
            return 0
        return int(float(rows[0].get("avg", 0.0)))


# ################################ /REPOSITORY ################################
