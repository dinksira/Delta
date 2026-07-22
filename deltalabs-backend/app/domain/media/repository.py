"""Media repository (MongoDB) for upload pipeline metadata."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING

from app.domain.media.schemas import MediaPublic


# ################################ REPOSITORY ################################
# Mongo persistence for media assets and feed publication linkage.
class Repository:
    def __init__(self, db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
        self._db = db

    async def ensure_indexes(self) -> None:
        await self._db["media_assets"].create_index(
            [("org_id", ASCENDING), ("created_at", DESCENDING)],
            name="ix_media_assets_org_created",
        )
        await self._db["media_assets"].create_index(
            [("owner_user_id", ASCENDING), ("created_at", DESCENDING)],
            name="ix_media_assets_owner_created",
        )
        await self._db["media_assets"].create_index(
            [("status", ASCENDING), ("updated_at", DESCENDING)],
            name="ix_media_assets_status_updated",
        )
        await self._db["media_assets"].create_index(
            [("upload_object_key", ASCENDING)],
            name="ix_media_assets_upload_object_key",
        )

    async def insert_media_asset(self, doc: dict[str, Any]) -> None:
        await self._db["media_assets"].insert_one(doc)

    async def find_media_asset(
        self, *, media_id: str, org_id: str | None = None
    ) -> dict[str, Any] | None:
        query: dict[str, Any] = {"_id": media_id}
        if org_id is not None:
            query["org_id"] = org_id
        return await self._db["media_assets"].find_one(query)

    async def find_media_asset_by_object_key(self, *, object_key: str) -> dict[str, Any] | None:
        return await self._db["media_assets"].find_one({"upload_object_key": object_key})

    async def update_media_asset(
        self,
        *,
        media_id: str,
        set_fields: dict[str, Any],
    ) -> dict[str, Any] | None:
        now = datetime.now(UTC)
        set_fields = {**set_fields, "updated_at": now}
        await self._db["media_assets"].update_one({"_id": media_id}, {"$set": set_fields})
        return await self.find_media_asset(media_id=media_id)

    async def upsert_feed_item_for_media(self, *, media_doc: dict[str, Any]) -> None:
        """Publish/refresh media as a feed item when ready."""
        if media_doc.get("visibility") != "public":
            return
        now = datetime.now(UTC)
        media_id = str(media_doc["_id"])
        video_src = str(
            media_doc.get("playback_url")
            or media_doc.get("hls_url")
            or media_doc.get("upload_url_fallback")
            or ""
        )
        poster = media_doc.get("poster_url")
        await self._db["content_items"].update_one(
            {"_id": media_id},
            {
                "$set": {
                    "visibility": "public",
                    "content_type": "video",
                    "created_at": media_doc.get("created_at", now),
                    "updated_at": now,
                    "video_src": video_src,
                    "poster_url": str(poster) if poster else "",
                    "duration_seconds": media_doc.get("duration_seconds"),
                    "media_tone": 0,
                    "caption": str(media_doc.get("caption", "")),
                    "hashtags": [str(tag) for tag in media_doc.get("hashtags", [])],
                    "pdf_label": "Open resource (PDF)",
                    "like_count": "0",
                }
            },
            upsert=True,
        )

    @staticmethod
    def doc_to_media_public(doc: dict[str, Any]) -> MediaPublic:
        return MediaPublic(
            id=str(doc["_id"]),
            org_id=str(doc["org_id"]),
            owner_user_id=str(doc["owner_user_id"]),
            source_filename=str(doc.get("source_filename", "")),
            source_content_type=str(doc.get("source_content_type", "")),
            status=str(doc.get("status", "unknown")),
            visibility=str(doc.get("visibility", "private")),
            caption=str(doc.get("caption", "")),
            hashtags=[str(tag) for tag in doc.get("hashtags", [])],
            publish_to_feed=bool(doc.get("publish_to_feed", False)),
            upload_object_key=str(doc.get("upload_object_key", "")),
            playback_url=(
                str(doc["playback_url"])
                if doc.get("playback_url") is not None
                else (str(doc["hls_url"]) if doc.get("hls_url") is not None else None)
            ),
            hls_url=(str(doc["hls_url"]) if doc.get("hls_url") is not None else None),
            poster_url=(str(doc["poster_url"]) if doc.get("poster_url") is not None else None),
            duration_seconds=(
                float(doc["duration_seconds"]) if doc.get("duration_seconds") is not None else None
            ),
            renditions=[dict(item) for item in doc.get("renditions", []) if isinstance(item, dict)],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )


# ################################ /REPOSITORY ################################
