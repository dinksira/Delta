"""Topic battle repository (MongoDB)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import DESCENDING

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

    async def insert_topic_battle(self, doc: dict[str, Any]) -> str:
        result = await self._db["topic_battles"].insert_one(doc)
        return str(result.inserted_id)

    async def find_all_topic_battles(self) -> list[dict[str, Any]]:
        cursor = self._db["topic_battles"].find().sort("created_at", DESCENDING)
        return await cursor.to_list(length=1000)

    async def find_topic_battle_by_id(self, battle_id: str) -> dict[str, Any] | None:
        return await self._db["topic_battles"].find_one({"_id": battle_id})

    async def increment_players_joined(self, battle_id: str) -> dict[str, Any] | None:
        now = datetime.now(UTC)
        await self._db["topic_battles"].update_one(
            {"_id": battle_id},
            {"$inc": {"players_joined": 1}, "$set": {"updated_at": now}},
        )
        return await self.find_topic_battle_by_id(battle_id)

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
    def doc_to_response(doc: dict[str, Any]) -> TopicBattleResponse:
        questions_raw = doc.get("questions", [])
        questions = [Repository.question_doc_to_response(q) for q in questions_raw]

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
            prize_pool=str(doc.get("prize_pool", "0 ETB")),
            entry_fee=str(doc.get("entry_fee", "Free")),
            players_joined=int(doc.get("players_joined", 0)),
            players_max=int(doc.get("players_max", 2)),
            created_at=doc.get("created_at", datetime.now(UTC)),
            questions=questions,
        )
