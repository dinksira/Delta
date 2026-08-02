"""Topic battle repository (MongoDB)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING

from app.domain.competitions.schemas import QuestionResponse, TopicBattleResponse


class Repository:
    def __init__(self, db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
        self._db = db

    async def ensure_indexes(self) -> None:
        await self._db["topic_battles"].create_index(
            [("created_at", DESCENDING)],
            name="ix_topic_battles_created",
        )
        await self._db["topic_battles"].create_index(
            [("status", DESCENDING)],
            name="ix_topic_battles_status",
        )
        await self._db["topic_battles"].create_index(
            [("owner_user_id", ASCENDING)],
            name="ix_topic_battles_owner",
        )
        await self._db["competition_modes"].create_index(
            [("id", ASCENDING)],
            name="ix_competition_modes_id",
            unique=True,
        )

    async def insert_topic_battle(self, doc: dict[str, Any]) -> str:
        result = await self._db["topic_battles"].insert_one(doc)
        return str(result.inserted_id)

    async def find_all_topic_battles(self) -> list[dict[str, Any]]:
        cursor = self._db["topic_battles"].find().sort("created_at", DESCENDING)
        return await cursor.to_list(length=1000)

    async def find_topic_battle_by_id(self, battle_id: str) -> dict[str, Any] | None:
        return await self._db["topic_battles"].find_one({"_id": battle_id})

    async def join_topic_battle(
        self,
        battle_id: str,
        user_id: str | None,
    ) -> dict[str, Any] | None:
        """Register a join. Authenticated joins are idempotent per user.

        The owner-guard is enforced in the service layer before calling this.
        """
        now = datetime.now(UTC)
        if user_id is None:
            await self._db["topic_battles"].update_one(
                {"_id": battle_id},
                {"$inc": {"players_joined": 1}, "$set": {"updated_at": now}},
            )
        else:
            await self._db["topic_battles"].update_one(
                {"_id": battle_id, "participants": {"$ne": user_id}},
                {
                    "$addToSet": {"participants": user_id},
                    "$inc": {"players_joined": 1},
                    "$set": {"updated_at": now},
                },
            )
        return await self.find_topic_battle_by_id(battle_id)

    async def find_all_topic_battles_by_owner(self, owner_user_id: str) -> list[dict[str, Any]]:
        cursor = (
            self._db["topic_battles"]
            .find({"owner_user_id": owner_user_id})
            .sort("created_at", DESCENDING)
        )
        return await cursor.to_list(length=1000)

    async def find_user_id_by_email(self, email: str) -> str | None:
        """Resolve a user's id by email for deterministic demo-battle seeding."""
        user = await self._db["users"].find_one(
            {"$or": [{"email": email}, {"email_normalized": email.lower()}]},
            {"_id": 1},
        )
        return str(user["_id"]) if user is not None else None

    async def upsert_topic_battle(self, doc: dict[str, Any]) -> None:
        """Insert or fully refresh a battle by its `_id` (used by demo seeding)."""
        battle_id = str(doc["_id"])
        fields = {key: value for key, value in doc.items() if key != "_id"}
        await self._db["topic_battles"].update_one(
            {"_id": battle_id},
            {"$set": fields},
            upsert=True,
        )

    # ========================================================================
    # Competition game modes
    # ========================================================================

    async def find_all_modes(self) -> list[dict[str, Any]]:
        cursor = self._db["competition_modes"].find().sort("position", ASCENDING)
        return await cursor.to_list(length=100)

    async def upsert_mode(self, mode: dict[str, Any]) -> None:
        mode_id = str(mode["id"])
        await self._db["competition_modes"].update_one(
            {"id": mode_id},
            {"$set": mode},
            upsert=True,
        )

    # ========================================================================
    # Per-user competition stats (level, points, joined/hosted/won, earnings)
    # ========================================================================

    async def get_user_stats(self, user_id: str) -> dict[str, Any] | None:
        return await self._db["competition_user_stats"].find_one({"_id": user_id})

    async def increment_user_stats(
        self,
        user_id: str,
        increments: dict[str, int],
    ) -> dict[str, Any] | None:
        now = datetime.now(UTC)
        await self._db["competition_user_stats"].update_one(
            {"_id": user_id},
            {
                "$inc": increments,
                "$set": {"updated_at": now},
                "$setOnInsert": {
                    "_id": user_id,
                    "points": 0,
                    "joined": 0,
                    "hosted": 0,
                    "won": 0,
                    "earnings_etb": 0,
                    "created_at": now,
                },
            },
            upsert=True,
        )
        return await self.get_user_stats(user_id)

    # ========================================================================
    # Question embedded operations
    # ========================================================================

    async def push_question(
        self, battle_id: str, question_dict: dict[str, Any],
    ) -> dict[str, Any] | None:
        now = datetime.now(UTC)
        await self._db["topic_battles"].update_one(
            {"_id": battle_id},
            {
                "$push": {"questions": question_dict},
                "$set": {"updated_at": now},
            },
        )
        return await self.find_topic_battle_by_id(battle_id)

    async def update_question(
        self,
        battle_id: str,
        question_id: str,
        update_fields: dict[str, Any],
    ) -> dict[str, Any] | None:
        now = datetime.now(UTC)
        set_fields = {f"questions.$[elem].{k}": v for k, v in update_fields.items()}
        set_fields["updated_at"] = now
        await self._db["topic_battles"].update_one(
            {"_id": battle_id},
            {"$set": set_fields},
            array_filters=[{"elem.id": question_id}],
        )
        return await self.find_topic_battle_by_id(battle_id)

    async def pull_question(self, battle_id: str, question_id: str) -> dict[str, Any] | None:
        now = datetime.now(UTC)
        await self._db["topic_battles"].update_one(
            {"_id": battle_id},
            {
                "$pull": {"questions": {"id": question_id}},
                "$set": {"updated_at": now},
            },
        )
        return await self.find_topic_battle_by_id(battle_id)

    # ========================================================================
    # Response mapping
    # ========================================================================

    @staticmethod
    def question_doc_to_response(q: dict[str, Any]) -> QuestionResponse:
        return QuestionResponse(
            id=str(q.get("id", "")),
            title=str(q.get("title", "")),
            description=str(q.get("description", "")),
            code_template=str(q.get("code_template", "")),
            language=str(q.get("language", "HTML")),
            difficulty=str(q.get("difficulty", "EASY")),
            time_limit_minutes=int(q.get("time_limit_minutes", 10)),
            points=float(q.get("points", 1.0)),
            hint_enabled=bool(q.get("hint_enabled", True)),
            hint_text=str(q.get("hint_text", "")),
            test_cases=list(q.get("test_cases", [])),
        )

    @staticmethod
    def doc_to_response(
        doc: dict[str, Any],
        viewer_user_id: str | None = None,
    ) -> TopicBattleResponse:
        questions_raw = doc.get("questions", [])
        questions = [Repository.question_doc_to_response(q) for q in questions_raw]

        owner_user_id = doc.get("owner_user_id")
        owner_str = str(owner_user_id) if owner_user_id else None
        participants = list(doc.get("participants", []))

        return TopicBattleResponse(
            id=str(doc["_id"]),
            title=str(doc.get("title", "")),
            subject=str(doc.get("subject", "")),
            difficulty=str(doc.get("difficulty", "Intermediate")),
            status=str(doc.get("status", "filling")),
            countdown_ends_at=(
                str(doc["countdown_ends_at"]) if doc.get("countdown_ends_at") else None
            ),
            creator=dict(doc.get("creator", {"name": "Unknown"})),
            owner_user_id=owner_str,
            is_owner=bool(
                owner_str is not None
                and viewer_user_id is not None
                and viewer_user_id == owner_str
            ),
            has_joined=bool(
                viewer_user_id is not None and viewer_user_id in participants
            ),
            prize_pool=str(doc.get("prize_pool", "0 ETB")),
            entry_fee=str(doc.get("entry_fee", "Free")),
            players_joined=int(doc.get("players_joined", 0)),
            players_max=int(doc.get("players_max", 2)),
            created_at=doc.get("created_at", datetime.now(UTC)),
            questions=questions,
        )
