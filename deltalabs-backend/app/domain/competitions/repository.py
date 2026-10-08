"""Topic battle repository (MongoDB)."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from pymongo.asynchronous.client_session import AsyncClientSession
from pymongo.errors import DuplicateKeyError, OperationFailure

from app.domain.competitions.schemas import (
    DesignPayloadSchema,
    MarkdownPayloadSchema,
    MatchingAnswerSchema,
    MediaAssetSchema,
    PublicDesignPayloadSchema,
    PublicMarkdownPayloadSchema,
    PublicMatchPromptSchema,
    PublicQuestionResponse,
    QuestionResponse,
    TopicBattleResponse,
)

logger = logging.getLogger("deltalabs.competitions")


class Repository:
    def __init__(self, db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
        self._db = db

    @property
    def db(self) -> AsyncIOMotorDatabase[dict[str, Any]]:
        """The underlying handle, for collaborators that share this database."""
        return self._db

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
        # "Battles I have joined" and "battles I have completed" are both read on
        # the dashboard path; without these they are full collection scans.
        await self._db["topic_battles"].create_index(
            [("participants", ASCENDING)],
            name="ix_topic_battles_participants",
        )
        await self._db["topic_battles"].create_index(
            [("completed_user_ids", ASCENDING)],
            name="ix_topic_battles_completed_users",
        )
        # Championship standings sorts on this field on every hub read.
        await self._db["competition_user_stats"].create_index(
            [("championship_points", DESCENDING)],
            name="ix_competition_user_stats_championship_points",
        )
        # Audit trail is always queried newest-first per entity.
        await self._db["competition_events"].create_index(
            [("entity_type", ASCENDING), ("entity_id", ASCENDING), ("created_at", DESCENDING)],
            name="ix_competition_events_entity",
        )
        await self._db["competition_events"].create_index(
            [("created_at", DESCENDING)],
            name="ix_competition_events_created",
        )
        # One answer per participant per question: this unique index is the
        # idempotency guarantee behind `insert_submission`.
        await self._db["competition_submissions"].create_index(
            [("battle_id", ASCENDING), ("user_id", ASCENDING), ("question_id", ASCENDING)],
            unique=True,
            name="ux_competition_submissions_answer",
        )
        await self._db["competition_submissions"].create_index(
            [("battle_id", ASCENDING), ("user_id", ASCENDING), ("submitted_at", ASCENDING)],
            name="ix_competition_submissions_history",
        )
        await self._db["competition_integrity_events"].create_index(
            [("battle_id", ASCENDING), ("user_id", ASCENDING), ("created_at", ASCENDING)],
            name="ix_competition_integrity_events_user",
        )
        await self._db["competition_integrity_flags"].create_index(
            [("battle_id", ASCENDING), ("user_id", ASCENDING), ("status", ASCENDING)],
            name="ix_competition_integrity_flags_review",
        )

    async def insert_topic_battle(self, doc: dict[str, Any]) -> str:
        result = await self._db["topic_battles"].insert_one(doc)
        return str(result.inserted_id)

    async def find_all_topic_battles(self) -> list[dict[str, Any]]:
        cursor = self._db["topic_battles"].find().sort("created_at", DESCENDING)
        return await cursor.to_list(length=1000)

    async def find_due_scheduled_battles(self, now: datetime) -> list[dict[str, Any]]:
        """Battles whose scheduled launch time has passed (flipped by the launcher)."""
        cursor = self._db["topic_battles"].find(
            {"status": "scheduled", "countdown_ends_at": {"$lte": now}}
        )
        return await cursor.to_list(length=100)

    async def find_stale_filling_battles(self, older_than: datetime) -> list[dict[str, Any]]:
        """Filling battles with no activity since `older_than` (no-show candidates
        for the sweepers, which cancel them instead of leaving dead battles up)."""
        cursor = self._db["topic_battles"].find(
            {"status": "filling", "updated_at": {"$lt": older_than}}
        )
        return await cursor.to_list(length=100)

    async def find_topic_battle_by_id(self, battle_id: str) -> dict[str, Any] | None:
        return await self._db["topic_battles"].find_one({"_id": battle_id})

    async def join_topic_battle(
        self,
        battle_id: str,
        user_id: str,
        *,
        session: AsyncClientSession | None = None,
    ) -> dict[str, Any] | None:
        """Register a join. Idempotent per user, and capacity-guarded.

        The seat cap is enforced inside the update filter with ``$expr`` so the
        comparison of the real participant count against ``players_max`` happens
        under the document's lock. Reading both values in the service and then
        writing would let two concurrent joiners both observe a free seat and
        overshoot the cap, because MongoDB cannot compare two fields in a plain
        query.

        Returns ``None`` when the filter matched nothing, which covers three
        cases the caller must disambiguate: the battle is gone, the battle is
        full, or this user is already seated.
        """
        now = datetime.now(UTC)
        await self._db["topic_battles"].update_one(
            {
                "_id": battle_id,
                "participants": {"$ne": user_id},
                "$expr": {
                    "$lt": [{"$size": {"$ifNull": ["$participants", []]}}, "$players_max"]
                },
            },
            {
                "$addToSet": {"participants": user_id},
                "$inc": {"players_joined": 1},
                "$set": {"updated_at": now},
            },
            session=session,
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
    # Per-user competition stats (level, points, joined/hosted/won)
    # ========================================================================

    async def get_user_stats(self, user_id: str) -> dict[str, Any] | None:
        return await self._db["competition_user_stats"].find_one({"_id": user_id})

    async def increment_user_stats(
        self,
        user_id: str,
        increments: dict[str, int],
        *,
        session: AsyncClientSession | None = None,
    ) -> dict[str, Any] | None:
        now = datetime.now(UTC)
        set_on_insert: dict[str, Any] = {
            "_id": user_id,
            "points": 0,
            "joined": 0,
            "hosted": 0,
            "won": 0,
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
            session=session,
        )
        return await self.get_user_stats(user_id)

    async def record_achievement_reward(
        self,
        user_id: str,
        rule_id: str,
        *,
        amount_etb: int,
    ) -> dict[str, Any] | None:
        """Stamp that ``rule_id`` has been paid out for ``user_id``.

        Written *after* the ledger credit: the record is a memo for "this
        reward was already settled", so a crash between the two writes leaves
        an owed (idempotent, replay-safe) credit rather than money that was
        never posted. The whole achievement unlock — including its timestamp —
        lives under one key, so ``unlocked_at`` and ``rewarded_at`` can never
        disagree.
        """
        now = datetime.now(UTC)
        await self._db["competition_user_stats"].update_one(
            {"_id": user_id},
            {
                "$set": {
                    f"achievement_rewards.{rule_id}": {
                        "amount_etb": int(amount_etb),
                        "credited_at": now.isoformat(),
                    },
                    "updated_at": now,
                },
                "$setOnInsert": {
                    "points": 0,
                    "joined": 0,
                    "hosted": 0,
                    "won": 0,
                    "created_at": now,
                },
            },
            upsert=True,
        )
        return await self.get_user_stats(user_id)

    async def join_topic_battle_with_stats(
        self,
        battle_id: str,
        user_id: str,
        *,
        increments: dict[str, int],
    ) -> tuple[dict[str, Any] | None, bool]:
        """Seat ``user_id`` and credit their stats as one atomic unit.

        Returns ``(document, seated)``. ``seated`` is ``True`` only when this
        call was the one that actually claimed the seat, so the service knows
        whether it still owes the stats credit.

        The seat write and the stats write must not be separable: a crash between
        them leaves a participant who was seated but never credited, or a credit
        for a seat that was rolled back. Both happen inside a single transaction.

        Standalone MongoDB (common in local dev) has no transaction support, so
        that case falls back to sequential writes. The seat write stays
        capacity-guarded either way, so the fallback cannot overshoot seats; only
        cross-document atomicity is lost.
        """
        client = self._db.client
        try:
            async with await client.start_session() as session, session.start_transaction():
                seated = await self._seat_topic_battle(
                    battle_id,
                    user_id,
                    session=session,
                )
                if seated:
                    await self.increment_user_stats(
                        user_id,
                        increments,
                        session=session,
                    )
        except OperationFailure as exc:
            if exc.code != 20:
                raise
            seated = await self._seat_topic_battle(battle_id, user_id, session=None)
            if seated:
                await self.increment_user_stats(user_id, increments, session=None)

        return await self.find_topic_battle_by_id(battle_id), seated

    async def _seat_topic_battle(
        self,
        battle_id: str,
        user_id: str,
        *,
        session: AsyncClientSession | None,
    ) -> bool:
        """Claim a seat under the capacity guard. Returns True when newly seated."""
        now = datetime.now(UTC)
        result = await self._db["topic_battles"].update_one(
            {
                "_id": battle_id,
                "participants": {"$ne": user_id},
                "$expr": {
                    "$lt": [{"$size": {"$ifNull": ["$participants", []]}}, "$players_max"]
                },
            },
            {
                "$addToSet": {"participants": user_id},
                "$inc": {"players_joined": 1},
                "$set": {"updated_at": now},
            },
            session=session,
        )
        return result.modified_count > 0

    async def complete_championship_stage_stats(
        self,
        user_id: str,
        stage_order: int,
        points: int,
    ) -> dict[str, Any] | None:
        """Credits stage points and records the stage as completed.

        Guarded by ``championship_completed != stage_order`` so a stage can
        never be double-credited for the same user. MongoDB re-checks that
        predicate under the document write lock, so two concurrent completions
        of the same stage credit once, not twice.

        Money is not touched here. The prize is owed through the wallet ledger
        (``WalletRepository.credit_stage_prize``) so it is explained by an entry
        and reconcilable; ``prize_etb`` used to be ``$inc``'d straight into this
        document, which produced a balance no entry could account for.
        """
        now = datetime.now(UTC)
        set_on_insert: dict[str, Any] = {
            "_id": user_id,
            "points": 0,
            "joined": 0,
            "hosted": 0,
            "won": 0,
            "championship_points": 0,
            "championship_completed": [],
            "created_at": now,
        }
        # A path cannot appear in both `$inc` and `$setOnInsert` (MongoDB
        # rejects the update with a conflict error when the doc is inserted).
        for key in ("points", "championship_points", "championship_completed"):
            set_on_insert.pop(key, None)
        await self._db["competition_user_stats"].update_one(
            {"_id": user_id, "championship_completed": {"$ne": stage_order}},
            {
                "$inc": {
                    "points": points,
                    "championship_points": points,
                },
                "$push": {"championship_completed": stage_order},
                "$set": {"updated_at": now},
                "$setOnInsert": set_on_insert,
            },
            upsert=True,
        )
        return await self.get_user_stats(user_id)

    # ========================================================================
    # Submissions + integrity signals (server-authoritative evidence)
    # ========================================================================

    async def insert_submission(
        self,
        *,
        battle_id: str,
        user_id: str,
        question_id: str,
        answer: dict[str, Any],
        correct: bool | None,
        earned_points: int,
        ip_hash: str | None,
        latency_ms: int | None,
        question_count: int,
        past_deadline: bool = False,
    ) -> bool:
        """Persist one graded answer. Returns False when already recorded.

        Idempotent per `(battle_id, user_id, question_id)` so a retried POST from
        a flaky connection cannot overwrite the original verdict or re-award
        points. The `insert_one` on a compound unique index is the guard, which
        is why this is not an upsert.
        """
        try:
            await self._db["competition_submissions"].insert_one(
                {
                    "_id": f"csub_{uuid4().hex}",
                    "battle_id": battle_id,
                    "user_id": user_id,
                    "question_id": question_id,
                    "answer": answer,
                    "correct": correct,
                    "earned_points": earned_points,
                    "past_deadline": past_deadline,
                    "ip_hash": ip_hash,
                    "latency_ms": latency_ms,
                    "question_count": question_count,
                    "submitted_at": datetime.now(UTC),
                }
            )
        except DuplicateKeyError:
            return False
        return True

    async def find_submission(
        self,
        *,
        battle_id: str,
        user_id: str,
        question_id: str,
    ) -> dict[str, Any] | None:
        """The already-recorded answer for this question, if any."""
        return await self._db["competition_submissions"].find_one(
            {
                "battle_id": battle_id,
                "user_id": user_id,
                "question_id": question_id,
            }
        )

    async def find_user_submissions(
        self,
        *,
        battle_id: str,
        user_id: str,
    ) -> list[dict[str, Any]]:
        cursor = self._db["competition_submissions"].find(
            {"battle_id": battle_id, "user_id": user_id},
        )
        return await cursor.to_list(length=1000)

    async def find_user_latencies(
        self,
        *,
        battle_id: str,
        user_id: str,
        exclude_question_id: str | None = None,
    ) -> list[int]:
        """Reported latencies for this participant's answers, in ms.

        `exclude_question_id` drops the answer currently being judged. Including
        it would be self-defeating: a single implausibly fast answer inflates the
        standard deviation enough to widen the threshold past itself, so the
        outlier would define its own tolerance and never trip.
        """
        query: dict[str, Any] = {
            "battle_id": battle_id,
            "user_id": user_id,
            "latency_ms": {"$ne": None},
        }
        if exclude_question_id is not None:
            query["question_id"] = {"$ne": exclude_question_id}

        cursor = self._db["competition_submissions"].find(query, {"latency_ms": 1})
        docs = await cursor.to_list(length=1000)
        return [int(d["latency_ms"]) for d in docs if d.get("latency_ms") is not None]

    async def count_user_submissions(self, *, battle_id: str, user_id: str) -> int:
        return await self._db["competition_submissions"].count_documents(
            {"battle_id": battle_id, "user_id": user_id},
        )

    async def insert_integrity_event(
        self,
        *,
        battle_id: str,
        user_id: str,
        event_type: str,
        question_id: str,
        violation: bool,
        detail: dict[str, Any],
    ) -> None:
        """Record a client-reported proctoring signal.

        `violation` is a top-level field because `count_integrity_violations`
        filters on it; burying it in `detail` would make the tally silently
        return zero and the threshold would never trip.
        """
        now = datetime.now(UTC)
        try:
            await self._db["competition_integrity_events"].insert_one(
                {
                    "_id": f"cie_{uuid4().hex}",
                    "battle_id": battle_id,
                    "user_id": user_id,
                    "event_type": event_type,
                    "question_id": question_id,
                    "violation": violation,
                    "detail": detail,
                    "created_at": now,
                }
            )
        except Exception as exc:  # noqa: BLE001 - telemetry must not break the quiz
            logger.warning(
                "competitions.integrity_event_write_failed",
                extra={"error": type(exc).__name__, "event_type": event_type},
            )

    async def count_integrity_violations(
        self,
        *,
        battle_id: str,
        user_id: str,
    ) -> int:
        return await self._db["competition_integrity_events"].count_documents(
            {
                "battle_id": battle_id,
                "user_id": user_id,
                "violation": True,
            },
        )

    async def insert_integrity_flag(
        self,
        *,
        battle_id: str,
        user_id: str,
        reason: str,
        detail: dict[str, Any],
    ) -> None:
        """Raise an advisory flag for organizer review.

        Never mutates a score. Its whole purpose is to put an entry in front of a
        human, since every automated signal here is individually forgeable.
        """
        now = datetime.now(UTC)
        try:
            await self._db["competition_integrity_flags"].insert_one(
                {
                    "_id": f"cif_{uuid4().hex}",
                    "battle_id": battle_id,
                    "user_id": user_id,
                    "reason": reason,
                    "detail": detail,
                    "status": "open",
                    "created_at": now,
                }
            )
        except Exception as exc:  # noqa: BLE001 - flagging must not break the quiz
            logger.warning(
                "competitions.integrity_flag_write_failed",
                extra={"error": type(exc).__name__, "reason": reason},
            )

    # ========================================================================
    # Active championship season (singleton store + per-user reset)
    # ========================================================================

    async def get_active_championship(self) -> dict[str, Any] | None:
        """Returns the persisted, currently hosted Championship season."""
        return await self._db["championships"].find_one({"_id": "active"})

    async def upsert_active_championship(self, doc: dict[str, Any]) -> dict[str, Any] | None:
        """Stores a new hosted Championship season as the active season."""
        await self._db["championships"].update_one(
            {"_id": "active"},
            {"$set": doc},
            upsert=True,
        )
        return await self.get_active_championship()

    async def reset_championship_progress(self) -> int:
        """Wipes per-user season progression when a new season is hosted.

        Lifetime points are untouched; only the season-scoped ``championship_*``
        fields reset so everyone starts the new season fresh.

        Season earnings are deliberately no longer reset here. They used to be a
        counter on this document, which meant a new season silently zeroed a
        money field. Season earnings are now a query over the wallet ledger, so
        nothing needs wiping. Documents written before this change may still hold
        a stale ``championship_earnings_etb``; nothing reads it, and unsetting it
        is left to a deliberate migration rather than smuggled into a season reset.
        """
        now = datetime.now(UTC)
        result = await self._db["competition_user_stats"].update_many(
            {},
            {
                "$set": {
                    "championship_completed": [],
                    "championship_points": 0,
                    "updated_at": now,
                },
            },
        )
        return result.modified_count

    async def find_user_profiles(
        self,
        user_ids: list[str],
    ) -> dict[str, dict[str, Any]]:
        """Resolve display names/avatars for a set of user ids in one query.

        Missing ids are simply absent from the result so callers can fall back
        to a generic label without a second lookup.
        """
        if not user_ids:
            return {}
        profiles: dict[str, dict[str, Any]] = {}
        async for user in self._db["users"].find(
            {"_id": {"$in": user_ids}},
            {"_id": 1, "username": 1, "full_name": 1, "avatar_url": 1},
        ):
            profiles[str(user["_id"])] = {
                "name": str(
                    user.get("full_name") or user.get("username") or "Player"
                ),
                "avatar_url": user.get("avatar_url"),
            }
        return profiles

    async def insert_competition_event(
        self,
        *,
        entity_type: str,
        entity_id: str,
        event_type: str,
        actor_user_id: str | None,
        detail: dict[str, Any] | None = None,
    ) -> None:
        """Append an immutable audit row.

        Deliberately never raises: an audit write must never be able to fail the
        business operation that triggered it. A dropped row is visible in the
        collection as a gap, which is preferable to losing the user's action.
        """
        now = datetime.now(UTC)
        try:
            await self._db["competition_events"].insert_one(
                {
                    "_id": f"cev_{uuid4().hex}",
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "event_type": event_type,
                    "actor_user_id": actor_user_id,
                    "detail": detail or {},
                    "created_at": now,
                }
            )
        except Exception as exc:  # noqa: BLE001 — audit must not break the write path
            logger.warning(
                "competitions.audit_write_failed",
                extra={
                    "error": type(exc).__name__,
                    "entity_type": entity_type,
                    "event_type": event_type,
                },
            )

    async def championship_standings(self, limit: int = 7) -> list[dict[str, Any]]:
        """Top season ladder entries from real per-user progression."""
        docs = await (
            self._db["competition_user_stats"]
            .find({"championship_points": {"$gt": 0}})
            .sort("championship_points", DESCENDING)
            .limit(limit)
        ).to_list(length=limit)
        ids = [str(doc["_id"]) for doc in docs]
        names: dict[str, str] = {}
        if ids:
            async for user in self._db["users"].find(
                {"_id": {"$in": ids}},
                {"_id": 1, "username": 1, "full_name": 1},
            ):
                uid = str(user["_id"])
                names[uid] = str(
                    user.get("full_name") or user.get("username") or "Player"
                )
        return [
            {
                "user_id": str(doc["_id"]),
                "name": names.get(str(doc["_id"]), "Player"),
                "points": int(doc.get("championship_points", 0) or 0),
            }
            for doc in docs
        ]

    async def championship_rank_and_total(self, points: int) -> tuple[int, int]:
        """Real ``(rank, total)`` for a points value on the season ladder.

        ``total`` counts every user who actually earned championship points;
        ``rank`` is standard competition ranking (tied players share a rank).
        A user with no points is not on the ladder, so their rank is 0.
        """
        collection = self._db["competition_user_stats"]
        total = await collection.count_documents({"championship_points": {"$gt": 0}})
        if points <= 0:
            return 0, total
        higher = await collection.count_documents({"championship_points": {"$gt": points}})
        return higher + 1, total

    async def complete_game_stage_stats(
        self,
        user_id: str,
        game_id: str,
        stage_order: int,
        points: int,
    ) -> dict[str, Any] | None:
        """Records a game ladder stage as completed and credits its points.

        Guarded so a stage can never be double-credited. As with the championship
        ladder, the prize is owed through the wallet ledger rather than
        ``$inc``'d into this document.
        """
        now = datetime.now(UTC)
        stage_path = f"game_stages.{game_id}"
        set_on_insert: dict[str, Any] = {
            "_id": user_id,
            "points": 0,
            "joined": 0,
            "hosted": 0,
            "won": 0,
            "game_stages": {game_id: []},
            "created_at": now,
        }
        await self._db["competition_user_stats"].update_one(
            {"_id": user_id, stage_path: {"$ne": stage_order}},
            {
                "$inc": {"points": points},
                "$push": {stage_path: stage_order},
                "$set": {"updated_at": now},
                "$setOnInsert": set_on_insert,
            },
            upsert=True,
        )
        return await self.get_user_stats(user_id)

    # ========================================================================
    # Question embedded operations
    # ========================================================================

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
    def public_question_doc_to_response(q: dict[str, Any]) -> PublicQuestionResponse:
        """Question payload for a participant — no answer key.

        Kept adjacent to `question_doc_to_response` so the two shapes are
        obviously a matched pair; a field added to the authoring payload must be
        consciously re-exposed here (it is not).
        """
        markdown_doc = q.get("markdown") or {}
        design_doc = q.get("design") or {}
        cover_doc = design_doc.get("cover") if isinstance(design_doc, dict) else None

        # Sample cases exist so a participant can iterate locally, so the input
        # is kept and the expected output dropped. Non-sample cases are withheld
        # entirely: their inputs would leak the shape of the hidden tests.
        sample_inputs = [
            str(case.get("input", ""))
            for case in q.get("test_cases", [])
            if isinstance(case, dict) and bool(case.get("is_sample"))
        ]

        # Both matching columns are player-facing; only the pairing is withheld.
        # The pool is passed through untouched and each prompt is rebuilt without
        # its `answer_id`, so nothing in the response can reconstruct the key.
        matching_answers = [
            MatchingAnswerSchema(
                id=str(answer.get("id", "")),
                text=str(answer.get("text", "")),
            )
            for answer in q.get("matching_answers", [])
            if isinstance(answer, dict)
        ]
        matching_prompts = [
            PublicMatchPromptSchema(
                id=str(pair.get("id", "")),
                prompt=str(pair.get("prompt", "")),
            )
            for pair in q.get("matching_pairs", [])
            if isinstance(pair, dict)
        ]

        # Fall back to the `[data-blank]` markers in the stem when a legacy
        # question has no per-blank answers stored.
        blank_count = len(q.get("fill_answers") or [])
        if blank_count == 0:
            blank_count = str(q.get("description", "")).count("[data-blank]")

        return PublicQuestionResponse(
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
            kind=str(q.get("kind", "coding")),
            mcq_options=list(q.get("mcq_options", [])),
            ordering_items=list(q.get("ordering_items", [])),
            markdown=PublicMarkdownPayloadSchema(
                source=str(markdown_doc.get("source", "")),
            )
            if isinstance(markdown_doc, dict)
            else PublicMarkdownPayloadSchema(),
            design=PublicDesignPayloadSchema(
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
            ),
            sample_inputs=sample_inputs,
            matching_answers=matching_answers,
            matching_prompts=matching_prompts,
            blank_count=blank_count,
        )

    @staticmethod
    def doc_to_response(
        doc: dict[str, Any],
        viewer_user_id: str | None = None,
    ) -> TopicBattleResponse:
        questions_raw = doc.get("questions", [])
        owner_user_id = doc.get("owner_user_id")
        owner_str = str(owner_user_id) if owner_user_id else None

        # Always the keyless shape, including for the owner. Hosting a battle and
        # authoring its questions happens in the owner-only management table, so
        # there is no reason for a read endpoint to hand the answer key back.
        questions = [Repository.public_question_doc_to_response(q) for q in questions_raw]
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
            players_joined=len(participants),
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
