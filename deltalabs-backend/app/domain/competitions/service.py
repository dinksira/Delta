"""Topic battle service — creation and listing logic."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from app.domain.competitions.repository import Repository
from app.domain.competitions.schemas import (
    AchievementResponse,
    CodingQuestionSchema,
    CompetitionHubResponse,
    CompetitionModeResponse,
    QuestionCreateRequest,
    QuestionResponse,
    QuestionUpdateRequest,
    TopicBattleCreateRequest,
    TopicBattleListResponse,
    TopicBattleResponse,
    UserStatusResponse,
)

# ################################ CONSTANTS ################################
# Server-side source of truth for the hub's game-mode cards.
DEFAULT_GAME_MODES: list[dict[str, object]] = [
    {
        "id": "topic-battles",
        "title": "Topic Battles",
        "description": (
            "Compete in structured challenges built around a single subject "
            "— from one topic to the podium."
        ),
        "action_label": "Enter Battle",
    },
    {
        "id": "championship",
        "title": "Championship",
        "description": (
            "Season-long knockout tournament. Climb the bracket and claim the crown."
        ),
        "action_label": "Join Tournament",
    },
    {
        "id": "live-duels",
        "title": "Live Duels",
        "description": (
            "Real-time one-on-one battles against a live opponent. Fast, intense, "
            "instant results."
        ),
        "action_label": "Quick Match",
    },
]

_POINTS_PER_LEVEL = 100

_DIFFICULTY_POINTS: dict[str, int] = {
    "Easy": 10,
    "Intermediate": 25,
    "Hard": 50,
}

_HOST_POINTS = 10

_RANK_TIERS: list[tuple[int, str]] = [
    (1, "Bronze"),
    (5, "Silver"),
    (10, "Gold"),
    (15, "Platinum"),
    (20, "Diamond"),
    (25, "Champion"),
]

_ROMAN_NUMERALS = ["I", "II", "III", "IV", "V"]

# ── Demo topic-battle seeding (local dev only) ────────────────────────────
# Deterministic `_id`s so seeding is idempotent across restarts. Owners are
# resolved by email so the battles stay tied to real identity records.
_DEMO_OWNER_EMAIL = "demo@deltalabs.dev"
_OTHER_OWNER_EMAIL = "dink@gmail.com"

# ################################ /CONSTANTS ################################

# ################################ HELPERS ################################
def _points_for_difficulty(difficulty: str) -> int:
    return _DIFFICULTY_POINTS.get(difficulty, 25)


def _rank_for_level(level: int) -> str:
    tier = "Bronze"
    for threshold, name in _RANK_TIERS:
        if level >= threshold:
            tier = name
    if tier == "Champion":
        return tier
    return f"{tier} {_ROMAN_NUMERALS[(level - 1) % 5]}"


def _achievement_rules() -> list[dict[str, object]]:
    return [
        {
            "id": "first-battle",
            "title": "First Steps",
            "description": "Joined your first competition",
            "unlocked_when": lambda s: s["joined"] >= 1,
        },
        {
            "id": "showrunner",
            "title": "Showrunner",
            "description": "Hosted your first competition",
            "unlocked_when": lambda s: s["hosted"] >= 1,
        },
        {
            "id": "regular-10",
            "title": "Regular",
            "description": "Joined 10 competitions",
            "unlocked_when": lambda s: s["joined"] >= 10,
        },
        {
            "id": "champion",
            "title": "Champion",
            "description": "Won your first competition",
            "unlocked_when": lambda s: s["won"] >= 1,
        },
    ]


# ################################ /HELPERS ################################


def _question_schema_to_dict(q: CodingQuestionSchema) -> dict:
    return {
        "id": q.id or f"q_{uuid4().hex}",
        "title": q.title,
        "description": q.description,
        "code_template": q.code_template,
        "language": q.language,
        "difficulty": q.difficulty,
        "time_limit_minutes": q.time_limit_minutes,
        "points": q.points,
        "hint_enabled": q.hint_enabled,
        "hint_text": q.hint_text,
        "test_cases": [t.model_dump() for t in q.test_cases],
    }


def _create_request_to_question_dict(q: QuestionCreateRequest) -> dict:
    return {
        "id": f"q_{uuid4().hex}",
        "title": q.title,
        "description": q.description,
        "code_template": q.code_template,
        "language": q.language,
        "difficulty": q.difficulty,
        "time_limit_minutes": q.time_limit_minutes,
        "points": q.points,
        "hint_enabled": q.hint_enabled,
        "hint_text": q.hint_text,
        "test_cases": [t.model_dump() for t in q.test_cases],
    }


class Service:
    def __init__(self, repository: Repository) -> None:
        self._repository = repository

    async def bootstrap(self) -> None:
        await self._repository.ensure_indexes()
        await self._seed_default_modes()

    async def _seed_default_modes(self) -> None:
        for position, mode in enumerate(DEFAULT_GAME_MODES):
            await self._repository.upsert_mode({**mode, "position": position})

    async def seed_demo_battles(self) -> None:
        """Ensure joinable/owned demo topic battles exist for local testing.

        - One battle owned by the demo account (manage/track only for its owner).
        - One battle owned by another user (joinable by the demo account).

        Battles are refreshed on startup so join counts reset between test runs.
        Skipped silently when the owner account does not exist.
        """
        await self.bootstrap()
        now = datetime.now(UTC)

        demo_owner_id = await self._repository.find_user_id_by_email(_DEMO_OWNER_EMAIL)
        if demo_owner_id is not None:
            await self._repository.upsert_topic_battle(
                {
                    "_id": "tb_demo_seed_owned",
                    "title": "Logic Gates Throwdown",
                    "subject": "Computer Science",
                    "difficulty": "Intermediate",
                    "status": "filling",
                    "countdown_ends_at": None,
                    "creator": {"name": "You"},
                    "prize_pool": "500 ETB",
                    "entry_fee": "Free",
                    "players_joined": 1,
                    "players_max": 4,
                    "owner_user_id": demo_owner_id,
                    "participants": [],
                    "questions": [
                        {
                            "id": "q_seed_nand",
                            "title": "Implement a NAND gate",
                            "description": "Write a function that returns the NAND of two booleans.",
                            "code_template": (
                                "function nandGate(a, b) {\n"
                                "  // your code here\n"
                                "}"
                            ),
                            "language": "JavaScript",
                            "difficulty": "Intermediate",
                            "time_limit_minutes": 15,
                            "points": 25.0,
                            "hint_enabled": True,
                            "hint_text": "NAND is NOT AND.",
                            "test_cases": [
                                {
                                    "input": "false, false",
                                    "expected_output": "true",
                                    "explanation": "NAND is NOT AND.",
                                    "is_sample": True,
                                    "is_hidden": False,
                                },
                                {
                                    "input": "true, true",
                                    "expected_output": "false",
                                    "explanation": "",
                                    "is_sample": False,
                                    "is_hidden": True,
                                },
                            ],
                        },
                        {
                            "id": "q_seed_fizzbuzz",
                            "title": "FizzBuzz",
                            "description": (
                                "Return the FizzBuzz value for a number n: 'Fizz' when "
                                "divisible by 3, 'Buzz' when divisible by 5, "
                                "'FizzBuzz' when divisible by both, else the number."
                            ),
                            "code_template": (
                                "function fizzBuzz(n) {\n"
                                "  // your code here\n"
                                "}"
                            ),
                            "language": "JavaScript",
                            "difficulty": "Easy",
                            "time_limit_minutes": 10,
                            "points": 10.0,
                            "hint_enabled": True,
                            "hint_text": "Check divisibility by 15 first.",
                            "test_cases": [
                                {
                                    "input": "3",
                                    "expected_output": "Fizz",
                                    "explanation": "3 is divisible by 3.",
                                    "is_sample": True,
                                    "is_hidden": False,
                                },
                                {
                                    "input": "15",
                                    "expected_output": "FizzBuzz",
                                    "explanation": "15 is divisible by 3 and 5.",
                                    "is_sample": False,
                                    "is_hidden": False,
                                },
                            ],
                        },
                    ],
                    "created_at": now,
                    "updated_at": now,
                }
            )

        other_owner_id = await self._repository.find_user_id_by_email(_OTHER_OWNER_EMAIL)
        if other_owner_id is not None:
            await self._repository.upsert_topic_battle(
                {
                    "_id": "tb_demo_seed_other",
                    "title": "Linear Algebra Sprint",
                    "subject": "Mathematics",
                    "difficulty": "Easy",
                    "status": "filling",
                    "countdown_ends_at": None,
                    "creator": {"name": "Elena Okafor"},
                    "prize_pool": "750 ETB",
                    "entry_fee": "Free",
                    "players_joined": 1,
                    "players_max": 4,
                    "owner_user_id": other_owner_id,
                    "participants": [],
                    "questions": [
                        {
                            "id": "q_seed_det",
                            "title": "Matrix determinant (2x2)",
                            "description": (
                                "Return the determinant of a 2x2 matrix given as a list of lists."
                            ),
                            "code_template": (
                                "def determinant(matrix):\n"
                                "    # your code here\n"
                                "    pass\n"
                            ),
                            "language": "Python",
                            "difficulty": "Easy",
                            "time_limit_minutes": 15,
                            "points": 15.0,
                            "hint_enabled": True,
                            "hint_text": "ad - bc.",
                            "test_cases": [
                                {
                                    "input": "[[1, 2], [3, 4]]",
                                    "expected_output": "-2",
                                    "explanation": "1*4 - 2*3 = -2.",
                                    "is_sample": True,
                                    "is_hidden": False,
                                }
                            ],
                        },
                        {
                            "id": "q_seed_dot",
                            "title": "Vector dot product",
                            "description": (
                                "Return the dot product of two equal-length integer vectors."
                            ),
                            "code_template": (
                                "def dot(a, b):\n"
                                "    # your code here\n"
                                "    pass\n"
                            ),
                            "language": "Python",
                            "difficulty": "Intermediate",
                            "time_limit_minutes": 15,
                            "points": 20.0,
                            "hint_enabled": True,
                            "hint_text": "Sum of pairwise products.",
                            "test_cases": [
                                {
                                    "input": "[1, 2], [3, 4]",
                                    "expected_output": "11",
                                    "explanation": "1*3 + 2*4 = 11.",
                                    "is_sample": True,
                                    "is_hidden": False,
                                }
                            ],
                        },
                    ],
                    "created_at": now,
                    "updated_at": now,
                }
            )

    # ========================================================================
    # Hub: game modes, user status, achievements
    # ========================================================================

    async def list_modes(self) -> list[CompetitionModeResponse]:
        await self.bootstrap()
        docs = await self._repository.find_all_modes()
        return [CompetitionModeResponse(**doc) for doc in docs]

    async def get_user_status(self, *, user_id: str | None) -> UserStatusResponse:
        if user_id is None:
            stats = None
        else:
            stats = await self._repository.get_user_stats(user_id)

        points = int(stats.get("points", 0)) if stats else 0
        earnings_etb = int(stats.get("earnings_etb", 0)) if stats else 0
        won = int(stats.get("won", 0)) if stats else 0

        level = 1 + points // _POINTS_PER_LEVEL
        band = points % _POINTS_PER_LEVEL

        return UserStatusResponse(
            level=level,
            rank=_rank_for_level(level),
            progress_label="Progress",
            progress_value=float(band),
            progress_text=f"{band}/{_POINTS_PER_LEVEL} PTS",
            earnings=f"{earnings_etb:,} ETB",
            won=won,
        )

    async def list_achievements(self, *, user_id: str | None) -> list[AchievementResponse]:
        if user_id is None:
            stats: dict[str, object] = {
                "joined": 0,
                "hosted": 0,
                "won": 0,
            }
        else:
            doc = await self._repository.get_user_stats(user_id)
            stats = doc or {"joined": 0, "hosted": 0, "won": 0}

        responses: list[AchievementResponse] = []
        for rule in _achievement_rules():
            unlocked = bool(rule["unlocked_when"](stats))
            unlocked_at = stats.get("unlocked_at")
            responses.append(
                AchievementResponse(
                    id=str(rule["id"]),
                    title=str(rule["title"]),
                    description=str(rule["description"]),
                    unlocked=unlocked,
                    unlocked_at=str(unlocked_at) if unlocked_at else None,
                )
            )
        return responses

    async def get_hub(self, *, user_id: str | None) -> CompetitionHubResponse:
        modes = await self.list_modes()
        user_status = await self.get_user_status(user_id=user_id)
        achievements = await self.list_achievements(user_id=user_id)

        my_battles: list[TopicBattleResponse] = []
        if user_id is not None:
            docs = await self._repository.find_all_topic_battles_by_owner(user_id)
            my_battles = [
                self._repository.doc_to_response(doc, viewer_user_id=user_id)
                for doc in docs
            ]

        return CompetitionHubResponse(
            modes=modes,
            user_status=user_status,
            achievements=achievements,
            my_battles=my_battles,
        )

    # ========================================================================
    # Topic Battle CRUD
    # ========================================================================

    async def create_topic_battle(
        self,
        *,
        payload: TopicBattleCreateRequest,
        user_id: str | None = None,
    ) -> TopicBattleResponse:
        await self.bootstrap()
        battle_id = f"tb_{uuid4().hex}"
        now = datetime.now(UTC)

        questions = [_question_schema_to_dict(q) for q in payload.questions]

        doc = {
            "_id": battle_id,
            "title": payload.title,
            "subject": payload.subject,
            "difficulty": payload.difficulty,
            "status": "filling",
            "countdown_ends_at": None,
            "creator": {
                "name": payload.creator_name,
            },
            "prize_pool": payload.prize_pool,
            "entry_fee": payload.entry_fee,
            "players_joined": 0,
            "players_max": payload.players_max,
            "owner_user_id": user_id,
            "participants": [],
            "questions": questions,
            "created_at": now,
            "updated_at": now,
        }

        await self._repository.insert_topic_battle(doc)
        if user_id is not None:
            await self._repository.increment_user_stats(
                user_id,
                {"hosted": 1, "points": _HOST_POINTS},
            )
        return self._repository.doc_to_response(doc)

    async def list_topic_battles(
        self,
        *,
        user_id: str | None = None,
    ) -> TopicBattleListResponse:
        await self.bootstrap()
        docs = await self._repository.find_all_topic_battles()
        battles = [
            self._repository.doc_to_response(doc, viewer_user_id=user_id)
            for doc in docs
        ]
        return TopicBattleListResponse(battles=battles, total=len(battles))

    async def get_topic_battle(
        self,
        *,
        battle_id: str,
        user_id: str | None = None,
    ) -> TopicBattleResponse:
        await self.bootstrap()
        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        return self._repository.doc_to_response(doc, viewer_user_id=user_id)

    async def join_topic_battle(
        self,
        *,
        battle_id: str,
        user_id: str | None = None,
    ) -> TopicBattleResponse:
        await self.bootstrap()
        from app.core.exceptions import NotFoundError, PermissionDeniedError

        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")

        owner_user_id = doc.get("owner_user_id")
        if user_id is not None and owner_user_id is not None and user_id == owner_user_id:
            raise PermissionDeniedError(
                "You cannot join a battle you created. Manage or track it instead.",
                code="cannot_join_own_battle",
            )

        participants = list(doc.get("participants", []))
        if user_id is not None and user_id in participants:
            return self._repository.doc_to_response(doc, viewer_user_id=user_id)

        updated = await self._repository.join_topic_battle(battle_id, user_id)
        if updated is None:
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        if user_id is not None:
            points = _points_for_difficulty(
                str(updated.get("difficulty", "Intermediate")),
            )
            await self._repository.increment_user_stats(
                user_id,
                {"joined": 1, "points": points},
            )
        return self._repository.doc_to_response(updated, viewer_user_id=user_id)

    # ========================================================================
    # Question CRUD (embedded in battle document)
    # ========================================================================

    async def add_question(
        self,
        *,
        battle_id: str,
        payload: QuestionCreateRequest,
    ) -> QuestionResponse:
        await self.bootstrap()
        question_dict = _create_request_to_question_dict(payload)
        doc = await self._repository.push_question(battle_id, question_dict)
        if doc is None:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        questions = doc.get("questions", [])
        q = next((q for q in questions if q["id"] == question_dict["id"]), None)
        if q is None:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Question not found after insert.", code="question_not_found")
        return self._repository.question_doc_to_response(q)

    async def get_question(
        self,
        *,
        battle_id: str,
        question_id: str,
    ) -> QuestionResponse:
        await self.bootstrap()
        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        questions = doc.get("questions", [])
        q = next((q for q in questions if q["id"] == question_id), None)
        if q is None:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Question not found.", code="question_not_found")
        return self._repository.question_doc_to_response(q)

    async def list_questions(
        self,
        *,
        battle_id: str,
    ) -> list[QuestionResponse]:
        await self.bootstrap()
        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        questions = doc.get("questions", [])
        return [self._repository.question_doc_to_response(q) for q in questions]

    async def update_question(
        self,
        *,
        battle_id: str,
        question_id: str,
        payload: QuestionUpdateRequest,
    ) -> QuestionResponse:
        await self.bootstrap()
        update_fields = payload.model_dump(exclude_none=True, exclude={"test_cases"})
        if payload.test_cases is not None:
            update_fields["test_cases"] = [t.model_dump() for t in payload.test_cases]

        if not update_fields:
            from app.core.exceptions import ValidationError
            raise ValidationError("No fields to update.", code="no_update_fields")

        doc = await self._repository.update_question(
            battle_id=battle_id,
            question_id=question_id,
            update_fields=update_fields,
        )
        if doc is None:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Topic battle or question not found.", code="question_not_found")
        questions = doc.get("questions", [])
        q = next((q for q in questions if q["id"] == question_id), None)
        if q is None:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Question not found after update.", code="question_not_found")
        return self._repository.question_doc_to_response(q)

    async def delete_question(
        self,
        *,
        battle_id: str,
        question_id: str,
    ) -> None:
        await self.bootstrap()
        result = await self._repository.pull_question(battle_id, question_id)
        if result is None:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Topic battle or question not found.", code="question_not_found")
