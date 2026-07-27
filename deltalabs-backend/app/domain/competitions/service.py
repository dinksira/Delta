"""Topic battle service — creation and listing logic."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from app.domain.competitions.repository import Repository
from app.domain.competitions.schemas import (
    CodingQuestionSchema,
    QuestionCreateRequest,
    QuestionResponse,
    QuestionUpdateRequest,
    TopicBattleCreateRequest,
    TopicBattleListResponse,
    TopicBattleResponse,
)


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
            "questions": questions,
            "created_at": now,
            "updated_at": now,
        }

        await self._repository.insert_topic_battle(doc)
        return self._repository.doc_to_response(doc)

    async def list_topic_battles(self) -> TopicBattleListResponse:
        await self.bootstrap()
        docs = await self._repository.find_all_topic_battles()
        battles = [self._repository.doc_to_response(d) for d in docs]
        return TopicBattleListResponse(battles=battles, total=len(battles))

    async def get_topic_battle(self, *, battle_id: str) -> TopicBattleResponse:
        await self.bootstrap()
        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        return self._repository.doc_to_response(doc)

    async def join_topic_battle(self, *, battle_id: str) -> TopicBattleResponse:
        await self.bootstrap()
        doc = await self._repository.increment_players_joined(battle_id)
        if doc is None:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        return self._repository.doc_to_response(doc)

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
