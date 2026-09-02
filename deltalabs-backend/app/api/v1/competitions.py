"""Topic battle API — create, list, hub aggregates, question management, and code execution."""

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_current_user_optional, get_db
from app.domain.competitions.executor import CodeExecutor
from app.domain.competitions.repository import Repository as CompetitionsRepository
from app.domain.management_table.schemas import (
    ManagementTableColumnAppendInput,
    ManagementTableColumnPatchInput,
    ManagementTableDefinitionPublic,
    ManagementTableGroupPublic,
    ManagementTableInstanceBundleResponse,
    ManagementTableRowCellsPatchInput,
    ManagementTableRowListResponse,
    ManagementTableRowMoveInput,
    ManagementTableRowPublic,
    ManagementTableTableGroupCreateInput,
)
from app.domain.management_table.service import ManagementTableService
from app.domain.competitions.schemas import (
    CodeExecuteRequest,
    CodeExecuteResponse,
    CodeSubmitRequest,
    CodeSubmitResponse,
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


def _mt_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> ManagementTableService:
    from app.domain.management_table.repository import ManagementTableRepository as MtRepo
    from app.domain.school.repository import Repository as SchoolRepo
    return ManagementTableService(mt_repo=MtRepo(db), school_repo=SchoolRepo(db))


def _competitions_service(
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> CompetitionsService:
    return CompetitionsService(
        CompetitionsRepository(db),
        management_table_service=_mt_service(db),
    )


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


# ============================================================================
# Code execution (judge) — Judge0-backed sandbox for the Code Editor module
# ============================================================================


@router.post("/execute", response_model=CodeExecuteResponse)
async def execute_code(
    payload: CodeExecuteRequest,
    executor: CodeExecutor = Depends(lambda: CodeExecutor()),  # noqa: B008
) -> CodeExecuteResponse:
    """Run a single code snippet (Run action): compile + execute with stdin."""
    return await executor.run(payload)


@router.post("/submit", response_model=CodeSubmitResponse)
async def submit_code(
    payload: CodeSubmitRequest,
    executor: CodeExecutor = Depends(lambda: CodeExecutor()),  # noqa: B008
) -> CodeSubmitResponse:
    """Grade the authored test cases (Submit action): run per case, compare."""
    return await executor.submit(payload)


# ============================================================================
# Competition Management Table — per-user CRUD (school-free)
# ============================================================================


def _mt_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> ManagementTableService:
    from app.domain.management_table.repository import ManagementTableRepository as MtRepo
    from app.domain.school.repository import Repository as SchoolRepo
    return ManagementTableService(mt_repo=MtRepo(db), school_repo=SchoolRepo(db))


@router.post("/management-table/bootstrap", response_model=ManagementTableInstanceBundleResponse)
async def bootstrap_competition_management_table(
    org_id: str = Query(default="delta-labs"),
    user: CurrentUser = Depends(get_current_user),
    service: CompetitionsService = Depends(_competitions_service),
) -> ManagementTableInstanceBundleResponse:
    """Bootstrap the "My Competitions" table and autofill one row per owned battle."""
    return await service.autofill_competition_management_table(
        org_id=org_id, user_id=user.user_id,
    )


@router.get("/management-table/instance", response_model=ManagementTableInstanceBundleResponse)
async def get_competition_management_table_instance(
    instance_id: str = Query(),
    org_id: str = Query(default="delta-labs"),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),
) -> ManagementTableInstanceBundleResponse:
    svc = _mt_service(db)
    return await svc.comp_get_instance_bundle(org_id=org_id, user_id=user.user_id, instance_id=instance_id)


@router.get("/management-table/rows", response_model=ManagementTableRowListResponse)
async def list_competition_management_table_rows(
    instance_id: str = Query(),
    group_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    org_id: str = Query(default="delta-labs"),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),
) -> ManagementTableRowListResponse:
    svc = _mt_service(db)
    return await svc.comp_list_rows(
        org_id=org_id, user_id=user.user_id, instance_id=instance_id,
        group_id=group_id, page=page, page_size=page_size,
    )


@router.post("/management-table/rows", response_model=ManagementTableRowPublic)
async def create_competition_management_table_row(
    instance_id: str = Query(),
    group_id: str | None = Query(default=None),
    org_id: str = Query(default="delta-labs"),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),
) -> ManagementTableRowPublic:
    svc = _mt_service(db)
    return await svc.comp_create_row(
        org_id=org_id, user_id=user.user_id, instance_id=instance_id, group_id=group_id,
    )


@router.patch("/management-table/rows/{row_id}", response_model=ManagementTableRowPublic)
async def patch_competition_management_table_row(
    row_id: str,
    payload: ManagementTableRowCellsPatchInput,
    instance_id: str = Query(),
    org_id: str = Query(default="delta-labs"),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),
) -> ManagementTableRowPublic:
    svc = _mt_service(db)
    return await svc.comp_patch_row(
        org_id=org_id, user_id=user.user_id, instance_id=instance_id, row_id=row_id, payload=payload,
    )


@router.delete("/management-table/rows/{row_id}")
async def delete_competition_management_table_row(
    row_id: str,
    instance_id: str = Query(),
    org_id: str = Query(default="delta-labs"),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),
) -> dict[str, str]:
    svc = _mt_service(db)
    await svc.comp_delete_row(org_id=org_id, user_id=user.user_id, instance_id=instance_id, row_id=row_id)
    return {"status": "deleted"}


@router.post("/management-table/rows/{row_id}/move", response_model=ManagementTableRowPublic)
async def move_competition_management_table_row(
    row_id: str,
    payload: ManagementTableRowMoveInput,
    instance_id: str = Query(),
    org_id: str = Query(default="delta-labs"),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),
) -> ManagementTableRowPublic:
    svc = _mt_service(db)
    return await svc.comp_move_row(
        org_id=org_id, user_id=user.user_id, instance_id=instance_id, row_id=row_id, payload=payload,
    )


@router.post("/management-table/columns", response_model=ManagementTableDefinitionPublic)
async def append_competition_management_table_column(
    definition_id: str = Query(),
    payload: ManagementTableColumnAppendInput = ...,
    org_id: str = Query(default="delta-labs"),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),
) -> ManagementTableDefinitionPublic:
    svc = _mt_service(db)
    return await svc.comp_append_column(org_id=org_id, user_id=user.user_id, definition_id=definition_id, payload=payload)


@router.patch("/management-table/columns/{column_id}", response_model=ManagementTableDefinitionPublic)
async def patch_competition_management_table_column(
    column_id: str,
    payload: ManagementTableColumnPatchInput,
    definition_id: str = Query(),
    org_id: str = Query(default="delta-labs"),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),
) -> ManagementTableDefinitionPublic:
    svc = _mt_service(db)
    return await svc.comp_patch_column(org_id=org_id, user_id=user.user_id, definition_id=definition_id, column_id=column_id, payload=payload)


@router.delete("/management-table/columns/{column_id}", response_model=ManagementTableDefinitionPublic)
async def delete_competition_management_table_column(
    column_id: str,
    definition_id: str = Query(),
    org_id: str = Query(default="delta-labs"),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),
) -> ManagementTableDefinitionPublic:
    svc = _mt_service(db)
    return await svc.comp_delete_column(org_id=org_id, user_id=user.user_id, definition_id=definition_id, column_id=column_id)


@router.post("/management-table/groups", response_model=ManagementTableGroupPublic)
async def create_competition_management_table_group(
    payload: ManagementTableTableGroupCreateInput,
    instance_id: str = Query(),
    org_id: str = Query(default="delta-labs"),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),
) -> ManagementTableGroupPublic:
    svc = _mt_service(db)
    return await svc.comp_create_table_group(org_id=org_id, user_id=user.user_id, instance_id=instance_id, payload=payload)


# ============================================================================
# Battle-scoped Management Table — manage one hosted battle via the table
# ============================================================================


@router.post(
    "/topic-battles/{battle_id}/management-table/bootstrap",
    response_model=ManagementTableInstanceBundleResponse,
)
async def bootstrap_topic_battle_management_table(
    battle_id: str,
    user: CurrentUser = Depends(get_current_user),
    service: CompetitionsService = Depends(_competitions_service),
) -> ManagementTableInstanceBundleResponse:
    """Bootstrap (or load) the management table for one hosted battle."""
    return await service.bootstrap_topic_battle_management_table(
        battle_id=battle_id, user_id=user.user_id,
    )


@router.get(
    "/topic-battles/{battle_id}/management-table/instance",
    response_model=ManagementTableInstanceBundleResponse,
)
async def get_topic_battle_management_table(
    battle_id: str,
    user: CurrentUser = Depends(get_current_user),
    service: CompetitionsService = Depends(_competitions_service),
) -> ManagementTableInstanceBundleResponse:
    """Load the management-table bundle for a hosted battle."""
    return await service.get_topic_battle_management_table(
        battle_id=battle_id, user_id=user.user_id,
    )


@router.get(
    "/topic-battles/{battle_id}/management-table/rows",
    response_model=ManagementTableRowListResponse,
)
async def list_topic_battle_management_rows(
    battle_id: str,
    group_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    user: CurrentUser = Depends(get_current_user),
    service: CompetitionsService = Depends(_competitions_service),
) -> ManagementTableRowListResponse:
    """List rows of a hosted battle's management table."""
    return await service.list_topic_battle_management_rows(
        battle_id=battle_id, user_id=user.user_id,
        group_id=group_id, page=page, page_size=page_size,
    )


@router.patch(
    "/topic-battles/{battle_id}/management-table/rows/{row_id}",
    response_model=ManagementTableRowPublic,
)
async def patch_topic_battle_management_row(
    battle_id: str,
    row_id: str,
    payload: ManagementTableRowCellsPatchInput,
    user: CurrentUser = Depends(get_current_user),
    service: CompetitionsService = Depends(_competitions_service),
) -> ManagementTableRowPublic:
    """Patch a row cell; editable cells are synced back to the battle."""
    return await service.patch_topic_battle_management_row(
        battle_id=battle_id, user_id=user.user_id, row_id=row_id, payload=payload,
    )
