"""Topic battle repository (MongoDB)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING

from app.domain.competitions.schemas import (
    DesignPayloadSchema,
    MarkdownPayloadSchema,
    MediaAssetSchema,
    QuestionResponse,
    TopicBattleResponse,
)


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

    async def mark_topic_battle_completed(
        self,
        battle_id: str,
        user_id: str,
    ) -> dict[str, Any] | None:
        """Record that ``user_id`` finished the battle (idempotent per user)."""
        now = datetime.now(UTC)
        await self._db["topic_battles"].update_one(
            {"_id": battle_id, "completed_user_ids": {"$ne": user_id}},
            {
                "$addToSet": {"completed_user_ids": user_id},
                "$set": {"updated_at": now},
            },
        )
        return await self.find_topic_battle_by_id(battle_id)

    async def patch_topic_battle(self, battle_id: str, fields: dict[str, Any]) -> dict[str, Any] | None:
        """Apply ``$set`` updates to a battle document (management-table sync)."""
        now = datetime.now(UTC)
        await self._db["topic_battles"].update_one(
            {"_id": battle_id},
            {"$set": {**fields, "updated_at": now}},
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
        set_on_insert: dict[str, Any] = {
            "_id": user_id,
            "points": 0,
            "joined": 0,
            "hosted": 0,
            "won": 0,
            "earnings_etb": 0,
            "created_at": now,
        }
        # A path cannot appear in both `$inc` and `$setOnInsert` (MongoDB
        # rejects the update with a conflict error when the doc is inserted).
        for key in increments:
            set_on_insert.pop(key, None)
        await self._db["competition_user_stats"].update_one(
            {"_id": user_id},
            {
                "$inc": increments,
                "$set": {"updated_at": now},
                "$setOnInsert": set_on_insert,
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
    def _normalize_matching(
        raw_pairs: list[dict[str, Any]],
        raw_answers: list[dict[str, Any]],
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        """Normalize stored matching data into the answer-pool shape.

        New battles store `matching_answers` + pairs with `answer_id`. Legacy
        battles store `{ prompt, answer }` pairs without a pool — synthesize one
        (deduped case-insensitively) and map pairs onto it so grading stays
        id-based.
        """
        if raw_answers:
            answers = [
                {"id": str(a.get("id", "")), "text": str(a.get("text", ""))}
                for a in raw_answers
            ]
            pairs = [
                {
                    "id": str(p.get("id", "")),
                    "prompt": str(p.get("prompt", "")),
                    "answer_id": str(p.get("answer_id", "")),
                }
                for p in raw_pairs
            ]
            return pairs, answers

        seen: dict[str, str] = {}
        answers: list[dict[str, Any]] = []
        pairs: list[dict[str, Any]] = []
        for pair in raw_pairs:
            text = str(pair.get("answer", ""))
            if not text:
                continue
            key = text.strip().lower()
            answer_id = seen.get(key)
            if answer_id is None:
                answer_id = f"ans_{len(answers) + 1}"
                seen[key] = answer_id
                answers.append({"id": answer_id, "text": text})
            pairs.append(
                {
                    "id": str(pair.get("id", "")),
                    "prompt": str(pair.get("prompt", "")),
                    "answer_id": answer_id,
                }
            )
        return pairs, answers

    @staticmethod
    def question_doc_to_response(q: dict[str, Any]) -> QuestionResponse:
        raw_pairs = list(q.get("matching_pairs", []))
        raw_answers = list(q.get("matching_answers", []))
        matching_pairs, matching_answers = Repository._normalize_matching(raw_pairs, raw_answers)

        markdown_doc = q.get("markdown") or {}
        design_doc = q.get("design") or {}
        cover_doc = design_doc.get("cover") if isinstance(design_doc, dict) else None

        return QuestionResponse(
            id=str(q.get("id", "")),
            title=str(q.get("title", "")),
            description=str(q.get("description", "")),
            constraints=str(q.get("constraints", "")),
            code_template=str(q.get("code_template", "")),
            language=str(q.get("language", "HTML")),
            difficulty=str(q.get("difficulty", "EASY")),
            time_limit_minutes=int(q.get("time_limit_minutes", 10)),
            points=float(q.get("points", 1.0)),
            hint_enabled=bool(q.get("hint_enabled", True)),
            hint_text=str(q.get("hint_text", "")),
            test_cases=list(q.get("test_cases", [])),
            kind=str(q.get("kind", "coding")),
            mcq_options=list(q.get("mcq_options", [])),
            mcq_correct_id=str(q.get("mcq_correct_id", "")),
            tf_answer=bool(q.get("tf_answer", True)),
            fill_expected=str(q.get("fill_expected", "")),
            fill_answers=list(q.get("fill_answers", [])),
            matching_answers=matching_answers,
            matching_pairs=matching_pairs,
            ordering_items=list(q.get("ordering_items", [])),
            markdown=MarkdownPayloadSchema(
                source=str(markdown_doc.get("source", "")),
                rubric=str(markdown_doc.get("rubric", "")),
            )
            if isinstance(markdown_doc, dict)
            else MarkdownPayloadSchema(),
            design=DesignPayloadSchema(
                brief=str(design_doc.get("brief", "")) if isinstance(design_doc, dict) else "",
                cover=MediaAssetSchema(**cover_doc) if isinstance(cover_doc, dict) else None,
                canvas_width=int(design_doc.get("canvas_width", 1080))
                if isinstance(design_doc, dict)
                else 1080,
                canvas_height=int(design_doc.get("canvas_height", 1080))
                if isinstance(design_doc, dict)
                else 1080,
                deliverables=list(design_doc.get("deliverables", []))
                if isinstance(design_doc, dict)
                else [],
                rubric=str(design_doc.get("rubric", "")) if isinstance(design_doc, dict) else "",
            ),
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
        completed_user_ids = list(doc.get("completed_user_ids", []))

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
            has_completed=bool(
                viewer_user_id is not None and viewer_user_id in completed_user_ids
            ),
            prize_pool=str(doc.get("prize_pool", "0 ETB")),
            entry_fee=str(doc.get("entry_fee", "Free")),
            players_joined=int(doc.get("players_joined", 0)),
            players_max=int(doc.get("players_max", 2)),
            format=str(doc.get("format", "mini")),
            duration_minutes=int(doc.get("duration_minutes", 10)),
            visibility=str(doc.get("visibility", "public")),
            timing=str(doc.get("timing", "instant")),
            prize_rule=str(doc.get("prize_rule", "winner-takes-all")),
            question_pool_mode=str(doc.get("question_pool_mode", "auto")),
            schedule_date=str(doc.get("schedule_date", "")),
            schedule_time=str(doc.get("schedule_time", "")),
            schedule_timezone=str(doc.get("schedule_timezone", "UTC")),
            easy_pct=int(doc.get("easy_pct", 0)),
            medium_pct=int(doc.get("medium_pct", 100)),
            hard_pct=int(doc.get("hard_pct", 0)),
            created_at=doc.get("created_at", datetime.now(UTC)),
            questions=questions,
        )
