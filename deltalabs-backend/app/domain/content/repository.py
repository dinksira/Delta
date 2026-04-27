"""Content repository (MongoDB) for feed items."""

from __future__ import annotations

import json
from base64 import urlsafe_b64decode, urlsafe_b64encode
from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING

from app.domain.content.schemas import FeedItemPublic


def encode_feed_cursor(*, created_at: datetime, item_id: str) -> str:
    """Opaque cursor for descending created_at + _id pagination."""
    # ################################ REPOSITORY ################################
    payload = {"t": created_at.replace(tzinfo=UTC).isoformat(), "id": item_id}
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    return urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def decode_feed_cursor(value: str) -> tuple[datetime, str] | None:
    """Decode cursor; return None if invalid."""
    try:
        padded = value + "=" * ((4 - len(value) % 4) % 4)
        data = json.loads(urlsafe_b64decode(padded.encode("ascii")).decode("utf-8"))
        t = datetime.fromisoformat(str(data["t"]))
        if t.tzinfo is None:
            t = t.replace(tzinfo=UTC)
        return t, str(data["id"])
    except (KeyError, ValueError, json.JSONDecodeError, OSError):
        return None


class Repository:
    """MongoDB access for content_items."""

    def __init__(self, db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
        self._db = db

    async def ping(self) -> bool:
        """Connectivity check used by foundation tests."""
        return True

    async def ensure_indexes(self) -> None:
        """Indexes for feed listing by visibility and recency."""
        await self._db["content_items"].create_index(
            [("visibility", ASCENDING), ("created_at", DESCENDING), ("_id", DESCENDING)],
            name="ix_content_items_visibility_created_id",
        )
        await self._db["content_items"].create_index(
            [("content_type", ASCENDING), ("created_at", DESCENDING)],
            name="ix_content_items_type_created",
        )

    async def count_public_items(self, *, content_type: str | None) -> int:
        """Count items visible on the public feed."""
        query: dict[str, Any] = {"visibility": "public"}
        if content_type:
            query["content_type"] = content_type
        return int(await self._db["content_items"].count_documents(query))

    async def list_public_items(
        self,
        *,
        limit: int,
        cursor: tuple[datetime, str] | None,
        content_type: str | None,
        exclude_content_ids: set[str] | None = None,
    ) -> tuple[list[dict[str, Any]], bool]:
        """Return up to `limit` items; bool indicates more rows exist."""
        query: dict[str, Any] = {"visibility": "public"}
        if content_type:
            query["content_type"] = content_type
        if exclude_content_ids:
            query["_id"] = {"$nin": sorted(exclude_content_ids)}

        if cursor is not None:
            cursor_dt, cursor_id = cursor
            cursor_clause: dict[str, Any] = {
                "$or": [
                    {"created_at": {"$lt": cursor_dt}},
                    {
                        "created_at": cursor_dt,
                        "_id": {"$lt": cursor_id},
                    },
                ]
            }
            if exclude_content_ids:
                query = {"$and": [query, cursor_clause]}
            else:
                query.update(cursor_clause)

        cursor_mongo = (
            self._db["content_items"]
            .find(query)
            .sort([("created_at", DESCENDING), ("_id", DESCENDING)])
            .limit(limit + 1)
        )
        docs = await cursor_mongo.to_list(length=limit + 1)
        has_more = len(docs) > limit
        if has_more:
            docs = docs[:limit]
        return docs, has_more

    async def find_public_by_id(self, item_id: str) -> dict[str, Any] | None:
        """Load one public feed item by id."""
        return await self._db["content_items"].find_one(
            {"_id": item_id, "visibility": "public"},
        )

    async def list_like_counts(self, *, item_ids: list[str]) -> dict[str, int]:
        """Return aggregated like totals keyed by content id."""
        return await self._list_action_counts(collection="content_likes", item_ids=item_ids)

    async def list_save_counts(self, *, item_ids: list[str]) -> dict[str, int]:
        """Return aggregated save totals keyed by content id."""
        return await self._list_action_counts(collection="content_saves", item_ids=item_ids)

    async def list_comment_counts(self, *, item_ids: list[str]) -> dict[str, int]:
        """Return aggregated comment totals keyed by content id."""
        return await self._list_action_counts(collection="content_comments", item_ids=item_ids)

    async def list_share_counts(self, *, item_ids: list[str]) -> dict[str, int]:
        """Return aggregated share totals keyed by content id."""
        return await self._list_action_counts(collection="content_shares", item_ids=item_ids)

    async def list_user_liked_ids(self, *, user_id: str, item_ids: list[str]) -> set[str]:
        """Return content ids liked by user from the provided list."""
        return await self._list_user_action_ids(
            collection="content_likes",
            user_id=user_id,
            item_ids=item_ids,
        )

    async def list_user_saved_ids(self, *, user_id: str, item_ids: list[str]) -> set[str]:
        """Return content ids saved by user from the provided list."""
        return await self._list_user_action_ids(
            collection="content_saves",
            user_id=user_id,
            item_ids=item_ids,
        )

    async def _list_action_counts(self, *, collection: str, item_ids: list[str]) -> dict[str, int]:
        """Return aggregated totals keyed by content id for a collection."""
        if not item_ids:
            return {}
        rows = (
            await self._db[collection]
            .aggregate(
                [
                    {"$match": {"content_id": {"$in": item_ids}}},
                    {"$group": {"_id": "$content_id", "count": {"$sum": 1}}},
                ]
            )
            .to_list(length=len(item_ids))
        )
        counts: dict[str, int] = {}
        for row in rows:
            content_id = str(row.get("_id", ""))
            if content_id:
                counts[content_id] = int(row.get("count", 0))
        return counts

    async def _list_user_action_ids(
        self,
        *,
        collection: str,
        user_id: str,
        item_ids: list[str],
    ) -> set[str]:
        """Return content ids from `item_ids` where user has an action row."""
        if not item_ids:
            return set()
        rows = await (
            self._db[collection]
            .find(
                {"user_id": user_id, "content_id": {"$in": item_ids}},
                {"content_id": 1},
            )
            .to_list(length=len(item_ids))
        )
        return {str(row.get("content_id", "")) for row in rows if row.get("content_id")}

    async def list_recent_user_engaged_item_ids(
        self, *, user_id: str, limit: int = 120
    ) -> list[str]:
        """Load recent item ids the user interacted with across engagement collections."""
        rows: list[dict[str, Any]] = []
        for collection in ("content_likes", "content_saves", "content_comments", "content_shares"):
            batch = await (
                self._db[collection]
                .find({"user_id": user_id}, {"content_id": 1, "created_at": 1})
                .sort([("created_at", DESCENDING)])
                .limit(limit)
                .to_list(length=limit)
            )
            rows.extend(batch)

        rows.sort(
            key=lambda row: row.get("created_at", datetime.min.replace(tzinfo=UTC)), reverse=True
        )
        seen: set[str] = set()
        ordered: list[str] = []
        for row in rows:
            content_id = str(row.get("content_id", ""))
            if not content_id or content_id in seen:
                continue
            seen.add(content_id)
            ordered.append(content_id)
            if len(ordered) >= limit:
                break
        return ordered

    async def list_hashtag_rows_for_item_ids(self, *, item_ids: list[str]) -> list[dict[str, Any]]:
        """Load hashtag fields for the provided content ids."""
        if not item_ids:
            return []
        return (
            await self._db["content_items"]
            .find(
                {"_id": {"$in": item_ids}, "visibility": "public"},
                {"hashtags": 1},
            )
            .to_list(length=len(item_ids))
        )

    async def list_recent_user_events(
        self, *, user_id: str, limit: int = 300
    ) -> list[dict[str, Any]]:
        """Load recent telemetry events for a user used in ranking helpers."""
        return (
            await self._db["content_events"]
            .find(
                {"user_id": user_id},
                {"content_id": 1, "event": 1, "watch_ms": 1, "created_at": 1},
            )
            .sort([("created_at", DESCENDING)])
            .limit(limit)
            .to_list(length=limit)
        )

    async def insert_demo_items_if_empty(self) -> None:
        """Insert demo landing clips when DB is empty (local dev UX)."""
        if await self._db["content_items"].count_documents({}) > 0:
            return
        now = datetime.now(UTC)
        demos: list[dict[str, Any]] = []
        for idx in range(1, 14):
            item_id = f"c{idx}"
            demos.append(
                {
                    "_id": item_id,
                    "visibility": "public",
                    "content_type": "video",
                    "created_at": now,
                    "updated_at": now,
                    "video_src": f"/mock-feed-videos/video-{idx:02d}.mp4",
                    "media_tone": (idx - 1) % 6,
                    "caption": f"Demo feed item {idx} — replace with curated content.",
                    "hashtags": ["DeltaLabs", "Feed"],
                    "pdf_label": "Open resource (PDF)",
                    "like_count": f"{idx * 1000}",
                }
            )
        if demos:
            await self._db["content_items"].insert_many(demos)

    @staticmethod
    def doc_to_feed_item(doc: dict[str, Any]) -> FeedItemPublic:
        """Map Mongo document to public DTO."""
        return FeedItemPublic(
            id=str(doc["_id"]),
            videoSrc=str(doc.get("video_src", "")),
            mediaTone=int(doc.get("media_tone", 0)),
            caption=str(doc.get("caption", "")),
            hashtags=[str(h) for h in doc.get("hashtags", [])],
            pdfLabel=str(doc.get("pdf_label", "")),
            likeCount=int(doc.get("like_count", 0) or 0),
            saveCount=int(doc.get("save_count", 0) or 0),
            commentCount=int(doc.get("comment_count", 0) or 0),
            shareCount=int(doc.get("share_count", 0) or 0),
            likedByMe=bool(doc.get("liked_by_me", False)),
            savedByMe=bool(doc.get("saved_by_me", False)),
        )


# ################################ /REPOSITORY ################################
