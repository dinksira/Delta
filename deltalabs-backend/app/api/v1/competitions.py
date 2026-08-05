"""Topic battle API — create, list, hub aggregates, and question management."""

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_current_user_optional, get_db
from app.domain.competitions.repository import Repository as CompetitionsRepository
from app.domain.competitions.schemas import (
    CompetitionHubResponse,
    CompetitionModeResponse,
    QuestionCreateRequest,
    QuestionResponse,
    QuestionUpdateRequest,
    TopicBattleCreateRequest,
    TopicBattleListResponse,
    TopicBattleResponse,
)
from app.domain.competitions.service import Service as CompetitionsService

router = APIRouter(prefix="/competitions", tags=["competitions"])


def _competitions_service(
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> CompetitionsService:
    return CompetitionsService(CompetitionsRepository(db))


# ============================================================================
# Hub aggregates (game modes, user status, achievements)
# ============================================================================


@router.get("/modes", response_model=list[CompetitionModeResponse])
async def list_competition_modes(
    service: CompetitionsService = Depends(_competitions_service),  # noqa: B008
) -> list[CompetitionModeResponse]:
    return await service.list_modes()


@router.get("/hub", response_model=CompetitionHubResponse)
async def get_competition_hub(
    user: CurrentUser | None = Depends(get_current_user_optional),  # noqa: B008
    service: CompetitionsService = Depends(_competitions_service),  # noqa: B008
) -> CompetitionHubResponse:
    return await service.get_hub(user_id=user.user_id if user is not None else None)


# ============================================================================
# Topic Battle CRUD
# ============================================================================


@router.post("/topic-battles", response_model=TopicBattleResponse)
async def create_topic_battle(
    payload: TopicBattleCreateRequest,
    user: CurrentUser | None = Depends(get_current_user_optional),  # noqa: B008
    service: CompetitionsService = Depends(_competitions_service),  # noqa: B008
) -> TopicBattleResponse:
    return await service.create_topic_battle(
        payload=payload,
        user_id=user.user_id if user is not None else None,
    )


@router.get("/topic-battles", response_model=TopicBattleListResponse)
async def list_topic_battles(
    user: CurrentUser | None = Depends(get_current_user_optional),  # noqa: B008
    service: CompetitionsService = Depends(_competitions_service),  # noqa: B008
) -> TopicBattleListResponse:
    return await service.list_topic_battles(
        user_id=user.user_id if user is not None else None,
    )


@router.get("/topic-battles/{battle_id}", response_model=TopicBattleResponse)
async def get_topic_battle(
    battle_id: str,
    user: CurrentUser | None = Depends(get_current_user_optional),  # noqa: B008
    service: CompetitionsService = Depends(_competitions_service),  # noqa: B008
) -> TopicBattleResponse:
    return await service.get_topic_battle(
        battle_id=battle_id,
        user_id=user.user_id if user is not None else None,
    )


@router.post("/topic-battles/{battle_id}/join", response_model=TopicBattleResponse)
async def join_topic_battle(
    battle_id: str,
    user: CurrentUser | None = Depends(get_current_user_optional),  # noqa: B008
    service: CompetitionsService = Depends(_competitions_service),  # noqa: B008
) -> TopicBattleResponse:
    return await service.join_topic_battle(
        battle_id=battle_id,
        user_id=user.user_id if user is not None else None,
    )


@router.post("/topic-battles/{battle_id}/complete", response_model=TopicBattleResponse)
async def complete_topic_battle(
    battle_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    service: CompetitionsService = Depends(_competitions_service),  # noqa: B008
) -> TopicBattleResponse:
    return await service.complete_topic_battle(
        battle_id=battle_id,
        user_id=user.user_id,
    )


# ============================================================================
# Question CRUD (embedded in battle document)
# ============================================================================


@router.post("/topic-battles/{battle_id}/questions", response_model=QuestionResponse)
async def add_question(
    battle_id: str,
    payload: QuestionCreateRequest,
    service: CompetitionsService = Depends(_competitions_service),  # noqa: B008
) -> QuestionResponse:
    return await service.add_question(battle_id=battle_id, payload=payload)


@router.get("/topic-battles/{battle_id}/questions", response_model=list[QuestionResponse])
async def list_questions(
    battle_id: str,
    service: CompetitionsService = Depends(_competitions_service),  # noqa: B008
) -> list[QuestionResponse]:
    return await service.list_questions(battle_id=battle_id)


@router.get("/topic-battles/{battle_id}/questions/{question_id}", response_model=QuestionResponse)
async def get_question(
    battle_id: str,
    question_id: str,
    service: CompetitionsService = Depends(_competitions_service),  # noqa: B008
) -> QuestionResponse:
    return await service.get_question(battle_id=battle_id, question_id=question_id)


@router.put("/topic-battles/{battle_id}/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    battle_id: str,
    question_id: str,
    payload: QuestionUpdateRequest,
    service: CompetitionsService = Depends(_competitions_service),  # noqa: B008
) -> QuestionResponse:
    return await service.update_question(
        battle_id=battle_id, question_id=question_id, payload=payload,
    )


@router.delete("/topic-battles/{battle_id}/questions/{question_id}")
async def delete_question(
    battle_id: str,
    question_id: str,
    service: CompetitionsService = Depends(_competitions_service),  # noqa: B008
) -> dict[str, str]:
    await service.delete_question(battle_id=battle_id, question_id=question_id)
    return {"status": "deleted"}
