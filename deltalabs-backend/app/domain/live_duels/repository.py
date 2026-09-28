"""Live Duel room persistence (MongoDB).

Rooms created by hosts are stored in the `live_duels` collection with a string
`_id` (the hex `ObjectId`). Finished rooms keep a snapshot of their final
leaderboard + completion time for the lobby history/replay surface; the realtime
event fanout is Redis-based (`queue.py`) and kept out of this repository.

Deliberately *not* stored here:
- live online presence (Redis set in `queue.py`, TTL'd so stale members expire),
- scheduled-duel launch flipping (a launcher task mutates status through these
  query methods only).
"""

from __future__ import annotations

from time import time
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

# How long a room may sit silent (no joins/questions/answers/chat) before the
# sweeper treats it as abandoned and finishes it on the host's behalf.
STALE_LIVE_ROOM_TTL_SECONDS = 30 * 60


def _now_ms() -> int:
    return int(time() * 1000)


# ################################ REPOSITORY ################################
class Repository:
    """Persistence for Live Duel rooms."""

    def __init__(self, db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
        self._db = db

    @property
    def collection(self):
        return self._db["live_duels"]

    async def ensure_indexes(self) -> None:
        await self.collection.create_index("host_user_id")
        await self.collection.create_index("created_at")
        await self.collection.create_index("status")
        await self.collection.create_index([("status", 1), ("last_activity_at", -1)])

    async def insert(self, doc: dict[str, Any]) -> dict[str, Any]:
        result = await self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def find_by_id(self, room_id: str) -> dict[str, Any] | None:
        try:
            oid = ObjectId(room_id)
        except Exception:
            return None
        return await self.collection.find_one({"_id": oid})

    async def list_all(self) -> list[dict[str, Any]]:
        cursor = self.collection.find().sort("created_at", -1)
        return [doc async for doc in cursor]

    async def find_due_scheduled_duels(self, now_ms: int) -> list[dict[str, Any]]:
        """Scheduled rooms whose start time has passed (flipped live by the launcher)."""
        cursor = self.collection.find(
            {"status": "scheduled", "scheduled_at": {"$lte": now_ms}}
        ).sort("created_at", -1)
        return [doc async for doc in cursor]

    async def mark_scheduled_live(self, room_id: str) -> dict[str, Any] | None:
        """Flip a scheduled room to live and touch its activity clock."""
        try:
            oid = ObjectId(room_id)
        except Exception:
            return None
        await self.collection.update_one(
            {"_id": oid},
            {"$set": {"status": "live", "last_activity_at": _now_ms()}},
        )
        return await self.find_by_id(room_id)

    async def find_stale_live_rooms(self, now_ms: int, ttl_seconds: int) -> list[dict[str, Any]]:
        """Open rooms silent longer than the TTL — candidates for the abandoned sweeper."""
        cutoff = now_ms - ttl_seconds * 1000
        cursor = self.collection.find(
            {"status": "live", "last_activity_at": {"$lt": cutoff}}
        ).sort("last_activity_at", 1)
        return [doc async for doc in cursor]

    async def mark_finished(
        self,
        room_id: str,
        final_leaderboard: list[dict[str, Any]],
        winner_name: str | None,
    ) -> dict[str, Any] | None:
        try:
            oid = ObjectId(room_id)
        except Exception:
            return None
        await self.collection.update_one(
            {"_id": oid},
            {
                "$set": {
                    "status": "finished",
                    "final_leaderboard": final_leaderboard,
                    "winner_name": winner_name,
                    "finished_at": _now_ms(),
                    "last_activity_at": _now_ms(),
                }
            },
        )
        return await self.find_by_id(room_id)

    async def list_finished(self) -> list[dict[str, Any]]:
        cursor = self.collection.find({"status": "finished"}).sort("finished_at", -1)
        return [doc async for doc in cursor]

    async def mark_joined(self, room_id: str, user_id: str) -> dict[str, Any] | None:
        try:
            oid = ObjectId(room_id)
        except Exception:
            return None
        result = await self.collection.update_one(
            {"_id": oid},
            {
                "$inc": {"players_joined": 1},
                "$addToSet": {"joined_user_ids": user_id},
                "$set": {"last_activity_at": _now_ms()},
            },
        )
        if result.modified_count == 0:
            doc = await self.find_by_id(room_id)
            if doc is None:
                return None
        doc = await self.find_by_id(room_id)
        return doc

    async def append_question(
        self,
        room_id: str,
        question: dict[str, Any],
    ) -> dict[str, Any] | None:
        try:
            oid = ObjectId(room_id)
        except Exception:
            return None
        await self.collection.update_one(
            {"_id": oid},
            {
                "$push": {"questions": {"$each": [question], "$position": 0}},
                "$set": {"last_activity_at": _now_ms()},
            },
        )
        return await self.find_by_id(room_id)

    async def append_chat(
        self,
        room_id: str,
        message: dict[str, Any],
    ) -> dict[str, Any] | None:
        try:
            oid = ObjectId(room_id)
        except Exception:
            return None
        await self.collection.update_one(
            {"_id": oid},
            {
                "$push": {"chat": {"$each": [message], "$slice": -50}},
                "$set": {"last_activity_at": _now_ms()},
            },
        )
        return await self.find_by_id(room_id)

    async def append_answer(
        self,
        room_id: str,
        answer: dict[str, Any],
    ) -> dict[str, Any] | None:
        try:
            oid = ObjectId(room_id)
        except Exception:
            return None
        await self.collection.update_one(
            {"_id": oid},
            {
                "$push": {"answers": answer},
                "$set": {"last_activity_at": _now_ms()},
            },
        )
        return await self.find_by_id(room_id)

    @staticmethod
    def to_entry(doc: dict[str, Any]) -> dict[str, Any]:
        """Map a stored room doc to the camelCase lobby/room JSON shape."""
        return {
            "id": str(doc["_id"]),
            "title": doc.get("title", ""),
            "subject": doc.get("subject", "General"),
            "difficulty": doc.get("difficulty", "Medium"),
            "status": doc.get("status", "live"),
            "hostName": doc.get("host_name", ""),
            "hostAvatarUrl": doc.get("host_avatar_url"),
            "hostUserId": doc.get("host_user_id"),
            "viewers": doc.get("viewers", 0),
            "playersJoined": doc.get("players_joined", 1),
            "playersMax": doc.get("players_max", 16),
            "entryFee": doc.get("entry_fee", "Free"),
            "prizePool": doc.get("prize_pool", "0 ETB"),
            "durationLabel": doc.get("duration_label", "60 min"),
            "hasJoined": True,
            "scheduledAt": doc.get("scheduled_at") or None,
            "finalLeaderboard": doc.get("final_leaderboard") or None,
            "finishedAt": doc.get("finished_at") or None,
            "postedQuestions": doc.get("questions", []),
        }

    @staticmethod
    def to_chat(message: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": message.get("id", ""),
            "username": message.get("username", "viewer"),
            "avatarUrl": message.get("avatar_url"),
            "text": message.get("text", ""),
            "emoji": message.get("emoji"),
            "sentAt": message.get("sent_at", 0),
        }


# ################################ /REPOSITORY ################################