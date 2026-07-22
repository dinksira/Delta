from typing import Literal

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_db
from app.api.deps_authz import require_org_membership, require_org_permission
from app.core.exceptions import ValidationError
from app.domain.authorization.repository import Repository as AuthorizationRepository
from app.domain.authorization.schemas import PermissionCheckRequest
from app.domain.authorization.service import Service as AuthorizationService
from app.domain.management_table.repository import ManagementTableRepository
from app.domain.management_table.schemas import (
    ManagementTableColumnAppendInput,
    ManagementTableColumnPatchInput,
    ManagementTableDefinitionCreateInput,
    ManagementTableDefinitionInheritInput,
    ManagementTableDefinitionListResponse,
    ManagementTableDefinitionPublic,
    ManagementTableDefinitionUpdateInput,
    ManagementTableGroupPublic,
    ManagementTableInstanceBundleResponse,
    ManagementTableInstanceCreateInput,
    ManagementTableRowCellsPatchInput,
    ManagementTableRowListResponse,
    ManagementTableRowPublic,
    ManagementTableTableGroupCreateInput,
    ManagementTableWorkspaceBootstrapResponse,
)
from app.domain.management_table.service import ManagementTableService
from app.domain.course_qa.repository import CourseQaRepository
from app.domain.course_qa.schemas import (
    CourseQaAnswerCreateInput,
    CourseQaAnswerPublic,
    CourseQaAnswerUpdateInput,
    CourseQaCommentCreateInput,
    CourseQaQuestionCreateInput,
    CourseQaQuestionDetailPublic,
    CourseQaQuestionListResponse,
    CourseQaQuestionPublic,
    CourseQaQuestionUpdateInput,
    CourseQaVoteInput,
)
from app.domain.course_qa.service import CourseQaService
from app.domain.school.repository import Repository
from app.domain.school.schemas import (
    ClassSessionCreateInput,
    ClassSessionListResponse,
    ClassSessionPublic,
    ClassSessionUpdateInput,
    ClassRoadmapPublic,
    ClassRoadmapPutInput,
    ClassRoadmapResourcesResponse,
    ClassEnrollmentCreateInput,
    ClassEnrollmentListResponse,
    ClassEnrollmentPublic,
    ClassAttendanceStatePublic,
    AttendanceSessionSettingsInput,
    AttendanceDeviceCreateInput,
    AttendanceMarkPatchInput,
    AttendanceFormulaConfigPutInput,
    AttendanceRealtimeTrackPutInput,
    LeaveRequestSubmitInput,
    SchoolMemberSearchPicker,
    SchoolMemberSearchResponse,
    MarketplaceBidInput,
    MarketplaceBuyInput,
    MarketplaceCreateInput,
    MarketplaceListResponse,
    MarketplaceSortBy,
    MarketplaceSortDirection,
    MarketplaceUpdateInput,
    MarketplaceViewResponse,
    OfferCreateInput,
    OfferListResponse,
    OfferListView,
    OfferPublic,
    OfferStatusUpdateInput,
    SchoolArchiveInput,
    SchoolArchiveResponse,
    SchoolCreateInput,
    SchoolCreateMeInput,
    SchoolListResponse,
    SchoolPublic,
    SchoolUpdateInput,
    SchoolWorkspaceCreateInput,
    SchoolWorkspaceItemPublic,
    SchoolWorkspaceListResponse,
    SchoolWorkspaceUpdateInput,
)
from app.domain.school.service import Service

# ################################ CONSTANTS ################################
# Router declarations for school APIs.
router = APIRouter(prefix="/schools", tags=["schools"])
org_router = APIRouter(prefix="/orgs/{org_id}/schools", tags=["schools"])
# ################################ /CONSTANTS ################################


def _service(db: AsyncIOMotorDatabase[dict[str, object]]) -> Service:
    return Service(Repository(db))


def _management_table_service(
    db: AsyncIOMotorDatabase[dict[str, object]],
) -> ManagementTableService:
    repo = Repository(db)
    return ManagementTableService(
        mt_repo=ManagementTableRepository(db),
        school_repo=repo,
    )


def _course_qa_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> CourseQaService:
    return CourseQaService(
        qa_repo=CourseQaRepository(db),
        school_repo=Repository(db),
    )


async def _user_can_manage_school(
    *,
    db: AsyncIOMotorDatabase[dict[str, object]],
    org_id: str,
    user_id: str,
) -> bool:
    authz = _authz_service(db)
    decision = await authz.authorize(
        user_id=user_id,
        payload=PermissionCheckRequest(
            org_id=org_id,
            permission="school:manage",
            scope_type="org",
            scope_id=org_id,
        ),
    )
    return bool(decision.allowed)


def _authz_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> AuthorizationService:
    return AuthorizationService(AuthorizationRepository(db))


def _school_create_payload_from_me(payload: SchoolCreateMeInput) -> SchoolCreateInput:
    data = payload.model_dump(exclude={"target_org_id"}, exclude_none=False)
    return SchoolCreateInput.model_validate(data)


@router.get("")
async def get_schools_status() -> dict[str, str]:
    return {"status": "not_implemented", "module": "schools"}

@router.get(
    "/marketplace",
    response_model=MarketplaceListResponse,
)
async def get_global_school_marketplace_community(
    view: Literal["community", "bids", "listings"] = Query(default="community"),
    q: str | None = Query(default=None),
    status: Literal["active", "under_offer", "sold", "withdrawn"] | None = Query(default=None),
    school_type: str | None = Query(default=None, alias="schoolType"),
    min_price: float | None = Query(default=None, alias="minPrice"),
    max_price: float | None = Query(default=None, alias="maxPrice"),
    sort_by: MarketplaceSortBy = Query(default="created_at", alias="sortBy"),
    sort_direction: MarketplaceSortDirection = Query(default="desc", alias="sortDirection"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> MarketplaceListResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.list_marketplace_global(
        user_id=user.user_id,
        view=view,
        query_text=q,
        status=status,
        school_type=school_type,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        sort_direction=sort_direction,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/marketplace/{listing_id}",
    response_model=MarketplaceViewResponse,
)
async def get_global_school_marketplace_item(
    listing_id: str,
    _user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> MarketplaceViewResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.get_marketplace_item_global(listing_id=listing_id)


@router.post(
    "/marketplace/buy",
    response_model=OfferPublic,
)
async def buy_global_school_marketplace_item(
    payload: MarketplaceBuyInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> OfferPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.buy_marketplace_item_global(
        buyer_user_id=user.user_id,
        buyer_email=user.email,
        payload=payload,
    )


@router.post(
    "/marketplace/bid",
    response_model=OfferPublic,
)
async def bid_global_school_marketplace_item(
    payload: MarketplaceBidInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> OfferPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.bid_marketplace_item_global(
        buyer_user_id=user.user_id,
        buyer_email=user.email,
        payload=payload,
    )


@router.post(
    "/marketplace/bids/{offer_id}/withdraw",
    response_model=OfferPublic,
)
async def withdraw_global_school_marketplace_bid(
    offer_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> OfferPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.withdraw_marketplace_bid_global(offer_id=offer_id, user_id=user.user_id)


@router.patch(
    "/marketplace/{listing_id}",
    response_model=MarketplaceViewResponse,
)
async def update_global_school_marketplace_item(
    listing_id: str,
    payload: MarketplaceUpdateInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> MarketplaceViewResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.update_marketplace_item_global(listing_id=listing_id, user_id=user.user_id, payload=payload)


@router.post(
    "/marketplace/{listing_id}/withdraw",
    response_model=MarketplaceViewResponse,
)
async def withdraw_global_school_marketplace_item(
    listing_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> MarketplaceViewResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.withdraw_marketplace_item_global(listing_id=listing_id, user_id=user.user_id)


@router.delete(
    "/marketplace/{listing_id}",
)
async def delete_global_school_marketplace_item(
    listing_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> dict[str, str]:
    service = _service(db)
    await service.bootstrap()
    await service.delete_marketplace_item_global(listing_id=listing_id, user_id=user.user_id)
    return {"status": "deleted", "listingId": listing_id}


@router.get(
    "/offers",
    response_model=OfferListResponse,
)
async def get_my_school_offers(
    status: Literal["requested", "approved", "amendment", "rejected"] = Query(default="requested"),
    view: OfferListView = Query(default="received"),
    org_id: str | None = Query(default=None, alias="orgId"),
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> OfferListResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.list_offers_for_user(
        status=status,
        view=view,
        user_id=user.user_id,
        user_email=user.email,
        org_id=org_id,
    )


@router.post(
    "",
    response_model=SchoolPublic,
)
async def create_school_me(
    payload: SchoolCreateMeInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> SchoolPublic:
    """Create a school for the current user (orchestrated tenant + school).

    If ``targetOrgId`` is omitted: reuse the user's **first** organization where they are
    ``org_owner`` (all self-created schools share that tenant). If they have none yet,
    create one workspace org and become ``org_owner``, then create the school there.
    If ``targetOrgId`` is set, create the school in that org (requires ``school:manage``).
    """
    authz = _authz_service(db)
    school_service = _service(db)
    await authz.bootstrap_defaults()
    await school_service.bootstrap()

    school_only = _school_create_payload_from_me(payload)

    if payload.target_org_id:
        await authz.require_permission(
            user_id=user.user_id,
            payload=PermissionCheckRequest(
                org_id=payload.target_org_id,
                permission="school:manage",
                scope_type="org",
                scope_id=payload.target_org_id,
            ),
        )
        org_id = payload.target_org_id
    else:
        owner_org_ids = await authz.list_org_ids_where_user_is_owner(user_id=user.user_id)
        if owner_org_ids:
            org_id = owner_org_ids[0]
        else:
            org_resp = await authz.create_workspace_org_for_school_owner(
                user_id=user.user_id,
                workspace_name=f"{school_only.name.strip()} · Workspace",
            )
            org_id = org_resp.org.id

    return await school_service.create_school(
        org_id=org_id,
        user_id=user.user_id,
        user_email=user.email,
        payload=school_only,
    )


@org_router.get(
    "",
    response_model=SchoolListResponse,
    dependencies=[Depends(require_org_membership)],
)
async def get_org_schools(
    org_id: str,
    archived: bool = Query(default=False),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> SchoolListResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.list_schools(org_id=org_id, archived=archived)


@org_router.post(
    "",
    response_model=SchoolPublic,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def create_org_school(
    org_id: str,
    payload: SchoolCreateInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> SchoolPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.create_school(
        org_id=org_id,
        user_id=user.user_id,
        user_email=user.email,
        payload=payload,
    )


@org_router.get(
    "/{school_id}/workspace/items",
    response_model=SchoolWorkspaceListResponse,
    dependencies=[Depends(require_org_membership)],
)
async def get_org_school_workspace_items(
    org_id: str,
    school_id: str,
    item_type: str | None = Query(default=None, alias="type"),
    parent_id: str | None = Query(default=None, alias="parentId"),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> SchoolWorkspaceListResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.list_school_workspace_items(
        org_id=org_id,
        school_id=school_id,
        item_type=item_type,
        parent_item_id=parent_id,
    )


@org_router.get(
    "/{school_id}/workspace/items/{item_id}",
    response_model=SchoolWorkspaceItemPublic,
    dependencies=[Depends(require_org_membership)],
)
async def get_org_school_workspace_item(
    org_id: str,
    school_id: str,
    item_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> SchoolWorkspaceItemPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.get_school_workspace_item(
        org_id=org_id,
        school_id=school_id,
        item_id=item_id,
    )


@org_router.post(
    "/{school_id}/workspace/items",
    response_model=SchoolWorkspaceItemPublic,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def create_org_school_workspace_item(
    org_id: str,
    school_id: str,
    payload: SchoolWorkspaceCreateInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> SchoolWorkspaceItemPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.create_school_workspace_item(
        org_id=org_id,
        school_id=school_id,
        payload=payload,
    )


@org_router.patch(
    "/{school_id}/workspace/items/{item_id}",
    response_model=SchoolWorkspaceItemPublic,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def update_org_school_workspace_item(
    org_id: str,
    school_id: str,
    item_id: str,
    payload: SchoolWorkspaceUpdateInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> SchoolWorkspaceItemPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.update_school_workspace_item(
        org_id=org_id,
        school_id=school_id,
        item_id=item_id,
        payload=payload,
    )


@org_router.delete(
    "/{school_id}/workspace/items/{item_id}",
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def delete_org_school_workspace_item(
    org_id: str,
    school_id: str,
    item_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> dict[str, str]:
    service = _service(db)
    await service.bootstrap()
    await service.delete_school_workspace_item(
        org_id=org_id,
        school_id=school_id,
        item_id=item_id,
    )
    return {"status": "deleted", "itemId": item_id}


@org_router.get(
    "/{school_id}/classes/{class_workspace_item_id}/sessions",
    response_model=ClassSessionListResponse,
    dependencies=[Depends(require_org_membership)],
)
async def get_org_class_sessions(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ClassSessionListResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.list_class_sessions(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
    )


@org_router.post(
    "/{school_id}/classes/{class_workspace_item_id}/sessions",
    response_model=ClassSessionPublic,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def create_org_class_session(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    payload: ClassSessionCreateInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ClassSessionPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.create_class_session(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
        payload=payload,
    )


@org_router.patch(
    "/{school_id}/classes/{class_workspace_item_id}/sessions/{session_id}",
    response_model=ClassSessionPublic,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def update_org_class_session(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    session_id: str,
    payload: ClassSessionUpdateInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ClassSessionPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.update_class_session(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
        session_id=session_id,
        payload=payload,
    )


@org_router.delete(
    "/{school_id}/classes/{class_workspace_item_id}/sessions/{session_id}",
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def delete_org_class_session(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    session_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> dict[str, str]:
    service = _service(db)
    await service.bootstrap()
    await service.delete_class_session(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
        session_id=session_id,
    )
    return {"status": "deleted", "sessionId": session_id}


@org_router.get(
    "/{school_id}/classes/{class_workspace_item_id}/roadmap",
    response_model=ClassRoadmapPublic,
    dependencies=[Depends(require_org_membership)],
)
async def get_org_class_roadmap(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ClassRoadmapPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.get_class_roadmap(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
    )


@org_router.put(
    "/{school_id}/classes/{class_workspace_item_id}/roadmap",
    response_model=ClassRoadmapPublic,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def put_org_class_roadmap(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    payload: ClassRoadmapPutInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ClassRoadmapPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.put_class_roadmap(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
        payload=payload,
    )


@org_router.get(
    "/{school_id}/classes/{class_workspace_item_id}/roadmap/resources",
    response_model=ClassRoadmapResourcesResponse,
    dependencies=[Depends(require_org_membership)],
)
async def get_org_class_roadmap_resources(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ClassRoadmapResourcesResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.list_class_roadmap_resources(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
    )


@org_router.get(
    "/{school_id}/classes/{class_workspace_item_id}/attendance",
    response_model=ClassAttendanceStatePublic,
    dependencies=[Depends(require_org_membership)],
)
async def get_org_class_attendance(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ClassAttendanceStatePublic:
    service = _service(db)
    await service.bootstrap()
    return await service.get_class_attendance_state(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
    )


@org_router.post(
    "/{school_id}/classes/{class_workspace_item_id}/attendance/sessions",
    response_model=ClassAttendanceStatePublic,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def update_org_class_attendance_session_settings(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    payload: AttendanceSessionSettingsInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ClassAttendanceStatePublic:
    service = _service(db)
    await service.bootstrap()
    return await service.update_attendance_session_settings(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
        payload=payload,
    )


@org_router.post(
    "/{school_id}/classes/{class_workspace_item_id}/attendance/devices",
    response_model=ClassAttendanceStatePublic,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def register_org_class_attendance_device(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    payload: AttendanceDeviceCreateInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ClassAttendanceStatePublic:
    service = _service(db)
    await service.bootstrap()
    return await service.register_attendance_device(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
        payload=payload,
    )


@org_router.patch(
    "/{school_id}/classes/{class_workspace_item_id}/attendance/marks",
    response_model=ClassAttendanceStatePublic,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def patch_org_class_attendance_mark(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    payload: AttendanceMarkPatchInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ClassAttendanceStatePublic:
    service = _service(db)
    await service.bootstrap()
    return await service.patch_attendance_mark(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
        payload=payload,
    )


@org_router.put(
    "/{school_id}/classes/{class_workspace_item_id}/attendance/formula-config",
    response_model=ClassAttendanceStatePublic,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def put_org_class_attendance_formula_config(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    payload: AttendanceFormulaConfigPutInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ClassAttendanceStatePublic:
    service = _service(db)
    await service.bootstrap()
    return await service.update_attendance_formula_config(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
        payload=payload,
    )


@org_router.put(
    "/{school_id}/classes/{class_workspace_item_id}/attendance/realtime-track",
    response_model=ClassAttendanceStatePublic,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def put_org_class_attendance_realtime_track(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    payload: AttendanceRealtimeTrackPutInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ClassAttendanceStatePublic:
    service = _service(db)
    await service.bootstrap()
    return await service.update_attendance_realtime_track(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
        payload=payload,
    )


@org_router.get(
    "/{school_id}/classes/{class_workspace_item_id}/enrollments",
    response_model=ClassEnrollmentListResponse,
    dependencies=[Depends(require_org_membership)],
)
async def get_org_class_enrollments(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ClassEnrollmentListResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.list_class_enrollments(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
    )


@org_router.post(
    "/{school_id}/classes/{class_workspace_item_id}/enrollments",
    response_model=ClassEnrollmentPublic,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def create_org_class_enrollment(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    payload: ClassEnrollmentCreateInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ClassEnrollmentPublic:
    service = _service(db)
    await service.bootstrap()
    result = await service.enroll_student_in_class(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
        payload=payload,
        enrolled_by_user_id=user.user_id,
    )
    mt = _management_table_service(db)
    display_name = (
        result.user.full_name
        or result.user.username
        or result.user.email
        or "Student"
    )
    await mt.sync_class_enrollment_row(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
        student_name=display_name or "Student",
        email=result.user.email,
        user_id=result.user_id,
    )
    return result


@org_router.get(
    "/{school_id}/members/search",
    response_model=SchoolMemberSearchResponse,
    dependencies=[Depends(require_org_membership)],
)
async def search_org_school_members(
    org_id: str,
    school_id: str,
    q: str = Query(default="", max_length=200),
    limit: int = Query(default=20, ge=1, le=50),
    picker: SchoolMemberSearchPicker = Query(default="school_students"),
    class_workspace_item_id: str | None = Query(default=None, alias="classWorkspaceItemId"),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> SchoolMemberSearchResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.search_school_members(
        org_id=org_id,
        school_id=school_id,
        q=q,
        limit=limit,
        picker=picker,
        class_workspace_item_id=class_workspace_item_id,
    )


@org_router.post(
    "/{school_id}/workspace/items/{workspace_item_id}/students-table/bootstrap",
    response_model=ManagementTableWorkspaceBootstrapResponse,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def bootstrap_org_students_table_workspace_item(
    org_id: str,
    school_id: str,
    workspace_item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableWorkspaceBootstrapResponse:
    service = _service(db)
    await service.bootstrap()
    mt = _management_table_service(db)
    item = await service.get_school_workspace_item(
        org_id=org_id,
        school_id=school_id,
        item_id=workspace_item_id,
    )
    item_type = item.type
    if item_type == "class":
        return await mt.bootstrap_class_students_table(
            org_id=org_id,
            school_id=school_id,
            user_id=user.user_id,
            class_workspace_item_id=workspace_item_id,
        )
    if item_type == "student":
        return await mt.bootstrap_school_students_table(
            org_id=org_id,
            school_id=school_id,
            user_id=user.user_id,
            student_workspace_item_id=workspace_item_id,
        )
    raise ValidationError(
        "Workspace item cannot host a students table.",
        code="students_table_workspace_type_invalid",
    )


@org_router.post(
    "/{school_id}/classes/{class_workspace_item_id}/students-table/bootstrap",
    response_model=ManagementTableWorkspaceBootstrapResponse,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def bootstrap_org_class_students_table(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableWorkspaceBootstrapResponse:
    service = _service(db)
    await service.bootstrap()
    mt = _management_table_service(db)
    return await mt.bootstrap_class_students_table(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        class_workspace_item_id=class_workspace_item_id,
    )


@org_router.post(
    "/{school_id}/workspace/items/{workspace_item_id}/parents-table/bootstrap",
    response_model=ManagementTableWorkspaceBootstrapResponse,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def bootstrap_org_parents_table_workspace_item(
    org_id: str,
    school_id: str,
    workspace_item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableWorkspaceBootstrapResponse:
    service = _service(db)
    await service.bootstrap()
    mt = _management_table_service(db)
    item = await service.get_school_workspace_item(
        org_id=org_id,
        school_id=school_id,
        item_id=workspace_item_id,
    )
    if item.type != "class":
        if item.type == "parent":
            return await mt.bootstrap_school_parents_table(
                org_id=org_id,
                school_id=school_id,
                user_id=user.user_id,
                parent_workspace_item_id=workspace_item_id,
            )
        raise ValidationError(
            "Workspace item cannot host a parents table.",
            code="parents_table_workspace_type_invalid",
        )
    return await mt.bootstrap_class_parents_table(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        class_workspace_item_id=workspace_item_id,
    )


@org_router.post(
    "/{school_id}/classes/{class_workspace_item_id}/parents-table/bootstrap",
    response_model=ManagementTableWorkspaceBootstrapResponse,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def bootstrap_org_class_parents_table(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableWorkspaceBootstrapResponse:
    service = _service(db)
    await service.bootstrap()
    mt = _management_table_service(db)
    return await mt.bootstrap_class_parents_table(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        class_workspace_item_id=class_workspace_item_id,
    )


@org_router.post(
    "/{school_id}/workspace/items/{workspace_item_id}/leave-requests-table/bootstrap",
    response_model=ManagementTableWorkspaceBootstrapResponse,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def bootstrap_org_leave_requests_table_workspace_item(
    org_id: str,
    school_id: str,
    workspace_item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableWorkspaceBootstrapResponse:
    service = _service(db)
    await service.bootstrap()
    mt = _management_table_service(db)
    item = await service.get_school_workspace_item(
        org_id=org_id,
        school_id=school_id,
        item_id=workspace_item_id,
    )
    if item.type != "class":
        raise ValidationError(
            "Workspace item cannot host a leave requests table.",
            code="leave_requests_table_workspace_type_invalid",
        )
    return await mt.bootstrap_class_leave_requests_table(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        class_workspace_item_id=workspace_item_id,
    )


@org_router.post(
    "/{school_id}/classes/{class_workspace_item_id}/leave-requests-table/bootstrap",
    response_model=ManagementTableWorkspaceBootstrapResponse,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def bootstrap_org_class_leave_requests_table(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableWorkspaceBootstrapResponse:
    service = _service(db)
    await service.bootstrap()
    mt = _management_table_service(db)
    return await mt.bootstrap_class_leave_requests_table(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        class_workspace_item_id=class_workspace_item_id,
    )


@org_router.post(
    "/{school_id}/classes/{class_workspace_item_id}/leave-requests/submit",
    response_model=ManagementTableRowPublic,
    dependencies=[Depends(require_org_membership)],
)
async def submit_org_class_leave_request(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    payload: LeaveRequestSubmitInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableRowPublic:
    service = _service(db)
    await service.bootstrap()
    mt = _management_table_service(db)
    return await mt.submit_class_leave_request(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
        user_id=user.user_id,
        payload=payload,
    )


@org_router.post(
    "/{school_id}/workspace/items/{workspace_item_id}/teachers-table/bootstrap",
    response_model=ManagementTableWorkspaceBootstrapResponse,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def bootstrap_org_teachers_table_workspace_item(
    org_id: str,
    school_id: str,
    workspace_item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableWorkspaceBootstrapResponse:
    service = _service(db)
    await service.bootstrap()
    mt = _management_table_service(db)
    item = await service.get_school_workspace_item(
        org_id=org_id,
        school_id=school_id,
        item_id=workspace_item_id,
    )
    item_type = item.type
    if item_type == "class":
        return await mt.bootstrap_class_teachers_table(
            org_id=org_id,
            school_id=school_id,
            user_id=user.user_id,
            class_workspace_item_id=workspace_item_id,
        )
    if item_type == "staff":
        return await mt.bootstrap_school_teachers_table(
            org_id=org_id,
            school_id=school_id,
            user_id=user.user_id,
            staff_workspace_item_id=workspace_item_id,
        )
    raise ValidationError(
        "Workspace item cannot host a teachers table.",
        code="teachers_table_workspace_type_invalid",
    )


@org_router.post(
    "/{school_id}/classes/{class_workspace_item_id}/teachers-table/bootstrap",
    response_model=ManagementTableWorkspaceBootstrapResponse,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def bootstrap_org_class_teachers_table(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableWorkspaceBootstrapResponse:
    service = _service(db)
    await service.bootstrap()
    mt = _management_table_service(db)
    return await mt.bootstrap_class_teachers_table(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        class_workspace_item_id=class_workspace_item_id,
    )


@org_router.post(
    "/{school_id}/workspace/items/{workspace_item_id}/grades-table/bootstrap",
    response_model=ManagementTableWorkspaceBootstrapResponse,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def bootstrap_org_grades_table_workspace_item(
    org_id: str,
    school_id: str,
    workspace_item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableWorkspaceBootstrapResponse:
    service = _service(db)
    await service.bootstrap()
    mt = _management_table_service(db)
    item = await service.get_school_workspace_item(
        org_id=org_id,
        school_id=school_id,
        item_id=workspace_item_id,
    )
    if item.type != "class":
        raise ValidationError(
            "Workspace item cannot host a grades table.",
            code="grades_table_workspace_type_invalid",
        )
    return await mt.bootstrap_class_grades_table(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        class_workspace_item_id=workspace_item_id,
    )


@org_router.post(
    "/{school_id}/classes/{class_workspace_item_id}/grades-table/bootstrap",
    response_model=ManagementTableWorkspaceBootstrapResponse,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def bootstrap_org_class_grades_table(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableWorkspaceBootstrapResponse:
    service = _service(db)
    await service.bootstrap()
    mt = _management_table_service(db)
    return await mt.bootstrap_class_grades_table(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        class_workspace_item_id=class_workspace_item_id,
    )


@org_router.post(
    "/{school_id}/workspace/items/{workspace_item_id}/schedules-table/bootstrap",
    response_model=ManagementTableWorkspaceBootstrapResponse,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def bootstrap_org_schedules_table_workspace_item(
    org_id: str,
    school_id: str,
    workspace_item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableWorkspaceBootstrapResponse:
    service = _service(db)
    await service.bootstrap()
    mt = _management_table_service(db)
    item = await service.get_school_workspace_item(
        org_id=org_id,
        school_id=school_id,
        item_id=workspace_item_id,
    )
    if item.type != "class":
        raise ValidationError(
            "Workspace item cannot host a schedules table.",
            code="schedules_table_workspace_type_invalid",
        )
    return await mt.bootstrap_class_schedules_table(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        class_workspace_item_id=workspace_item_id,
    )


@org_router.post(
    "/{school_id}/classes/{class_workspace_item_id}/schedules-table/bootstrap",
    response_model=ManagementTableWorkspaceBootstrapResponse,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def bootstrap_org_class_schedules_table(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableWorkspaceBootstrapResponse:
    service = _service(db)
    await service.bootstrap()
    mt = _management_table_service(db)
    return await mt.bootstrap_class_schedules_table(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        class_workspace_item_id=class_workspace_item_id,
    )


@org_router.post(
    "/{school_id}/workspace/items/{workspace_item_id}/assignments-table/bootstrap",
    response_model=ManagementTableWorkspaceBootstrapResponse,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def bootstrap_org_assignments_table_workspace_item(
    org_id: str,
    school_id: str,
    workspace_item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableWorkspaceBootstrapResponse:
    service = _service(db)
    await service.bootstrap()
    mt = _management_table_service(db)
    item = await service.get_school_workspace_item(
        org_id=org_id,
        school_id=school_id,
        item_id=workspace_item_id,
    )
    if item.type != "class":
        raise ValidationError(
            "Workspace item cannot host an assignments table.",
            code="assignments_table_workspace_type_invalid",
        )
    return await mt.bootstrap_class_assignments_table(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        class_workspace_item_id=workspace_item_id,
    )


@org_router.post(
    "/{school_id}/classes/{class_workspace_item_id}/assignments-table/bootstrap",
    response_model=ManagementTableWorkspaceBootstrapResponse,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def bootstrap_org_class_assignments_table(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableWorkspaceBootstrapResponse:
    service = _service(db)
    await service.bootstrap()
    mt = _management_table_service(db)
    return await mt.bootstrap_class_assignments_table(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        class_workspace_item_id=class_workspace_item_id,
    )


@org_router.delete(
    "/{school_id}/classes/{class_workspace_item_id}/enrollments/{enrollment_id}",
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def delete_org_class_enrollment(
    org_id: str,
    school_id: str,
    class_workspace_item_id: str,
    enrollment_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> dict[str, str]:
    service = _service(db)
    await service.bootstrap()
    await service.withdraw_class_enrollment(
        org_id=org_id,
        school_id=school_id,
        class_workspace_item_id=class_workspace_item_id,
        enrollment_id=enrollment_id,
    )
    return {"status": "withdrawn", "enrollmentId": enrollment_id}


@org_router.get(
    "/{school_id}",
    response_model=SchoolPublic,
    dependencies=[Depends(require_org_membership)],
)
async def get_org_school(
    org_id: str,
    school_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> SchoolPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.get_school(org_id=org_id, school_id=school_id)


@org_router.patch(
    "/{school_id}",
    response_model=SchoolPublic,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def update_org_school(
    org_id: str,
    school_id: str,
    payload: SchoolUpdateInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> SchoolPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.update_school(org_id=org_id, school_id=school_id, payload=payload)


@org_router.patch(
    "/{school_id}/archive",
    response_model=SchoolArchiveResponse,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def archive_org_school(
    org_id: str,
    school_id: str,
    payload: SchoolArchiveInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> SchoolArchiveResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.archive_school(org_id=org_id, school_id=school_id, payload=payload)


@org_router.get(
    "/marketplace",
    response_model=MarketplaceListResponse,
    dependencies=[Depends(require_org_membership)],
)
async def get_org_school_marketplace(
    org_id: str,
    view: Literal["community", "bids", "listings"] = Query(default="community"),
    q: str | None = Query(default=None),
    status: Literal["active", "under_offer", "sold", "withdrawn"] | None = Query(default=None),
    school_type: str | None = Query(default=None, alias="schoolType"),
    min_price: float | None = Query(default=None, alias="minPrice"),
    max_price: float | None = Query(default=None, alias="maxPrice"),
    sort_by: MarketplaceSortBy = Query(default="created_at", alias="sortBy"),
    sort_direction: MarketplaceSortDirection = Query(default="desc", alias="sortDirection"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> MarketplaceListResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.list_marketplace(
        org_id=org_id,
        user_id=user.user_id,
        view=view,
        query_text=q,
        status=status,
        school_type=school_type,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        sort_direction=sort_direction,
        page=page,
        page_size=page_size,
    )


@org_router.get(
    "/marketplace/{listing_id}",
    response_model=MarketplaceViewResponse,
    dependencies=[Depends(require_org_membership)],
)
async def get_org_school_marketplace_item(
    org_id: str,
    listing_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> MarketplaceViewResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.get_marketplace_item(org_id=org_id, listing_id=listing_id)


@org_router.post(
    "/marketplace",
    response_model=dict,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def create_org_school_marketplace_item(
    org_id: str,
    payload: MarketplaceCreateInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> dict:
    service = _service(db)
    await service.bootstrap()
    item = await service.create_marketplace_item(org_id=org_id, user_id=user.user_id, payload=payload)
    return item.model_dump(mode="json", by_alias=True)


@org_router.patch(
    "/marketplace/{listing_id}",
    response_model=MarketplaceViewResponse,
    dependencies=[Depends(require_org_membership)],
)
async def update_org_school_marketplace_item(
    org_id: str,
    listing_id: str,
    payload: MarketplaceUpdateInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> MarketplaceViewResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.update_marketplace_item(
        org_id=org_id,
        listing_id=listing_id,
        user_id=user.user_id,
        payload=payload,
    )


@org_router.post(
    "/marketplace/{listing_id}/withdraw",
    response_model=MarketplaceViewResponse,
    dependencies=[Depends(require_org_membership)],
)
async def withdraw_org_school_marketplace_item(
    org_id: str,
    listing_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> MarketplaceViewResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.withdraw_marketplace_item(
        org_id=org_id,
        listing_id=listing_id,
        user_id=user.user_id,
    )


@org_router.delete(
    "/marketplace/{listing_id}",
    dependencies=[Depends(require_org_membership)],
)
async def delete_org_school_marketplace_item(
    org_id: str,
    listing_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> dict[str, str]:
    service = _service(db)
    await service.bootstrap()
    await service.delete_marketplace_item(
        org_id=org_id,
        listing_id=listing_id,
        user_id=user.user_id,
    )
    return {"status": "deleted", "listingId": listing_id}


@org_router.post(
    "/marketplace/buy",
    response_model=OfferPublic,
    dependencies=[Depends(require_org_membership)],
)
async def buy_org_school_marketplace_item(
    org_id: str,
    payload: MarketplaceBuyInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> OfferPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.buy_marketplace_item(
        org_id=org_id,
        buyer_user_id=user.user_id,
        buyer_email=user.email,
        payload=payload,
    )


@org_router.post(
    "/marketplace/bid",
    response_model=OfferPublic,
    dependencies=[Depends(require_org_membership)],
)
async def bid_org_school_marketplace_item(
    org_id: str,
    payload: MarketplaceBidInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> OfferPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.bid_marketplace_item(
        org_id=org_id,
        buyer_user_id=user.user_id,
        buyer_email=user.email,
        payload=payload,
    )


@org_router.get(
    "/marketplace/{listing_id}/offers",
    response_model=OfferListResponse,
    dependencies=[Depends(require_org_membership)],
)
async def get_org_school_marketplace_listing_offers(
    org_id: str,
    listing_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> OfferListResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.list_marketplace_listing_offers(
        org_id=org_id,
        listing_id=listing_id,
        user_id=user.user_id,
    )


@org_router.get(
    "/offers",
    response_model=OfferListResponse,
)
async def get_org_school_offers(
    org_id: str,
    status: Literal["requested", "approved", "amendment", "rejected"] = Query(default="requested"),
    view: OfferListView = Query(default="received"),
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> OfferListResponse:
    service = _service(db)
    await service.bootstrap()
    return await service.list_offers(
        org_id=org_id,
        status=status,
        view=view,
        user_id=user.user_id,
        user_email=user.email,
    )


@org_router.post(
    "/offers",
    response_model=OfferPublic,
    dependencies=[Depends(require_org_permission("school:manage", scope_type="org"))],
)
async def create_org_school_offer(
    org_id: str,
    payload: OfferCreateInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> OfferPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.create_offer(
        org_id=org_id,
        user_id=user.user_id,
        user_email=user.email,
        payload=payload,
    )


@org_router.patch(
    "/offers/{offer_id}/status",
    response_model=OfferPublic,
)
async def update_org_school_offer_status(
    org_id: str,
    offer_id: str,
    payload: OfferStatusUpdateInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> OfferPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.update_offer_status(
        org_id=org_id,
        offer_id=offer_id,
        user_id=user.user_id,
        user_email=user.email,
        payload=payload,
    )


@org_router.post(
    "/offers/{offer_id}/shortlist",
    response_model=OfferPublic,
)
async def shortlist_org_school_offer(
    org_id: str,
    offer_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> OfferPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.shortlist_offer(
        org_id=org_id,
        offer_id=offer_id,
        user_id=user.user_id,
    )


@org_router.post(
    "/offers/{offer_id}/unshortlist",
    response_model=OfferPublic,
)
async def unshortlist_org_school_offer(
    org_id: str,
    offer_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> OfferPublic:
    service = _service(db)
    await service.bootstrap()
    return await service.unshortlist_offer(
        org_id=org_id,
        offer_id=offer_id,
        user_id=user.user_id,
    )


@org_router.get(
    "/{school_id}/management-tables/definitions",
    response_model=ManagementTableDefinitionListResponse,
    dependencies=[Depends(require_org_membership)],
)
async def list_org_school_management_table_definitions(
    org_id: str,
    school_id: str,
    scope: str = Query(default="all"),
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableDefinitionListResponse:
    school = _service(db)
    await school.bootstrap()
    mt = _management_table_service(db)
    return await mt.list_definitions(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        scope=scope,
    )


@org_router.post(
    "/{school_id}/management-tables/definitions",
    response_model=ManagementTableDefinitionPublic,
    dependencies=[
        Depends(require_org_permission("school:manage", scope_type="school", scope_id_param="school_id")),
    ],
)
async def create_org_school_management_table_definition(
    org_id: str,
    school_id: str,
    payload: ManagementTableDefinitionCreateInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableDefinitionPublic:
    school = _service(db)
    await school.bootstrap()
    mt = _management_table_service(db)
    return await mt.create_definition(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        payload=payload,
    )


@org_router.get(
    "/{school_id}/management-tables/definitions/{definition_id}",
    response_model=ManagementTableDefinitionPublic,
    dependencies=[Depends(require_org_membership)],
)
async def get_org_school_management_table_definition(
    org_id: str,
    school_id: str,
    definition_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableDefinitionPublic:
    school = _service(db)
    await school.bootstrap()
    mt = _management_table_service(db)
    return await mt.get_definition(org_id=org_id, school_id=school_id, definition_id=definition_id)


@org_router.patch(
    "/{school_id}/management-tables/definitions/{definition_id}",
    response_model=ManagementTableDefinitionPublic,
    dependencies=[
        Depends(require_org_permission("school:manage", scope_type="school", scope_id_param="school_id")),
    ],
)
async def patch_org_school_management_table_definition(
    org_id: str,
    school_id: str,
    definition_id: str,
    payload: ManagementTableDefinitionUpdateInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableDefinitionPublic:
    school = _service(db)
    await school.bootstrap()
    mt = _management_table_service(db)
    return await mt.update_definition(
        org_id=org_id,
        school_id=school_id,
        definition_id=definition_id,
        payload=payload,
    )


@org_router.post(
    "/{school_id}/management-tables/definitions/{definition_id}/columns",
    response_model=ManagementTableDefinitionPublic,
    dependencies=[
        Depends(require_org_permission("school:manage", scope_type="school", scope_id_param="school_id")),
    ],
)
async def append_org_school_management_table_column(
    org_id: str,
    school_id: str,
    definition_id: str,
    payload: ManagementTableColumnAppendInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableDefinitionPublic:
    school = _service(db)
    await school.bootstrap()
    mt = _management_table_service(db)
    return await mt.append_column(
        org_id=org_id,
        school_id=school_id,
        definition_id=definition_id,
        payload=payload,
    )


@org_router.patch(
    "/{school_id}/management-tables/definitions/{definition_id}/columns/{column_id}",
    response_model=ManagementTableDefinitionPublic,
    dependencies=[
        Depends(require_org_permission("school:manage", scope_type="school", scope_id_param="school_id")),
    ],
)
async def patch_org_school_management_table_column(
    org_id: str,
    school_id: str,
    definition_id: str,
    column_id: str,
    payload: ManagementTableColumnPatchInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableDefinitionPublic:
    school = _service(db)
    await school.bootstrap()
    mt = _management_table_service(db)
    return await mt.patch_column(
        org_id=org_id,
        school_id=school_id,
        definition_id=definition_id,
        column_id=column_id,
        payload=payload,
    )


@org_router.delete(
    "/{school_id}/management-tables/definitions/{definition_id}/columns/{column_id}",
    response_model=ManagementTableDefinitionPublic,
    dependencies=[
        Depends(require_org_permission("school:manage", scope_type="school", scope_id_param="school_id")),
    ],
)
async def delete_org_school_management_table_column(
    org_id: str,
    school_id: str,
    definition_id: str,
    column_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableDefinitionPublic:
    school = _service(db)
    await school.bootstrap()
    mt = _management_table_service(db)
    return await mt.remove_column(
        org_id=org_id,
        school_id=school_id,
        definition_id=definition_id,
        column_id=column_id,
    )


@org_router.post(
    "/{school_id}/management-tables/definitions/{definition_id}/inherit",
    response_model=ManagementTableDefinitionPublic,
    dependencies=[
        Depends(require_org_permission("school:manage", scope_type="school", scope_id_param="school_id")),
    ],
)
async def inherit_org_school_management_table_definition(
    org_id: str,
    school_id: str,
    definition_id: str,
    payload: ManagementTableDefinitionInheritInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableDefinitionPublic:
    school = _service(db)
    await school.bootstrap()
    mt = _management_table_service(db)
    return await mt.inherit_definition(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        source_definition_id=definition_id,
        payload=payload,
    )


@org_router.post(
    "/{school_id}/management-tables/instances",
    response_model=ManagementTableInstanceBundleResponse,
    dependencies=[
        Depends(require_org_permission("school:manage", scope_type="school", scope_id_param="school_id")),
    ],
)
async def create_org_school_management_table_instance(
    org_id: str,
    school_id: str,
    payload: ManagementTableInstanceCreateInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableInstanceBundleResponse:
    school = _service(db)
    await school.bootstrap()
    mt = _management_table_service(db)
    return await mt.create_instance(org_id=org_id, school_id=school_id, payload=payload)


@org_router.get(
    "/{school_id}/management-tables/instances/{instance_id}",
    response_model=ManagementTableInstanceBundleResponse,
    dependencies=[Depends(require_org_membership)],
)
async def get_org_school_management_table_instance(
    org_id: str,
    school_id: str,
    instance_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableInstanceBundleResponse:
    school = _service(db)
    await school.bootstrap()
    mt = _management_table_service(db)
    return await mt.get_instance_bundle(org_id=org_id, school_id=school_id, instance_id=instance_id)


@org_router.get(
    "/{school_id}/management-tables/instances/{instance_id}/rows",
    response_model=ManagementTableRowListResponse,
    dependencies=[Depends(require_org_membership)],
)
async def list_org_school_management_table_rows(
    org_id: str,
    school_id: str,
    instance_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=500, alias="pageSize"),
    group_id: str | None = Query(default=None, alias="groupId"),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableRowListResponse:
    school = _service(db)
    await school.bootstrap()
    mt = _management_table_service(db)
    return await mt.list_rows(
        org_id=org_id,
        school_id=school_id,
        instance_id=instance_id,
        group_id=group_id,
        page=page,
        page_size=page_size,
    )


@org_router.post(
    "/{school_id}/management-tables/instances/{instance_id}/rows",
    response_model=ManagementTableRowPublic,
    dependencies=[
        Depends(require_org_permission("school:manage", scope_type="school", scope_id_param="school_id")),
    ],
)
async def create_org_school_management_table_row(
    org_id: str,
    school_id: str,
    instance_id: str,
    group_id: str | None = Query(default=None, alias="groupId"),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableRowPublic:
    school = _service(db)
    await school.bootstrap()
    mt = _management_table_service(db)
    return await mt.create_row(
        org_id=org_id,
        school_id=school_id,
        instance_id=instance_id,
        group_id=group_id,
    )


@org_router.post(
    "/{school_id}/management-tables/instances/{instance_id}/table-groups",
    response_model=ManagementTableGroupPublic,
    dependencies=[
        Depends(require_org_permission("school:manage", scope_type="school", scope_id_param="school_id")),
    ],
)
async def create_org_school_management_table_group(
    org_id: str,
    school_id: str,
    instance_id: str,
    payload: ManagementTableTableGroupCreateInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableGroupPublic:
    school = _service(db)
    await school.bootstrap()
    mt = _management_table_service(db)
    return await mt.create_table_group(
        org_id=org_id,
        school_id=school_id,
        instance_id=instance_id,
        payload=payload,
    )


@org_router.patch(
    "/{school_id}/management-tables/instances/{instance_id}/rows/{row_id}",
    response_model=ManagementTableRowPublic,
    dependencies=[
        Depends(require_org_permission("school:manage", scope_type="school", scope_id_param="school_id")),
    ],
)
async def patch_org_school_management_table_row(
    org_id: str,
    school_id: str,
    instance_id: str,
    row_id: str,
    payload: ManagementTableRowCellsPatchInput,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableRowPublic:
    school = _service(db)
    await school.bootstrap()
    mt = _management_table_service(db)
    return await mt.patch_row(
        org_id=org_id,
        school_id=school_id,
        instance_id=instance_id,
        row_id=row_id,
        payload=payload,
    )


@org_router.post(
    "/{school_id}/workspace/items/{workspace_item_id}/management-table/bootstrap",
    response_model=ManagementTableWorkspaceBootstrapResponse,
    dependencies=[
        Depends(require_org_permission("school:manage", scope_type="school", scope_id_param="school_id")),
    ],
)
async def bootstrap_org_school_workspace_management_table(
    org_id: str,
    school_id: str,
    workspace_item_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> ManagementTableWorkspaceBootstrapResponse:
    school = _service(db)
    await school.bootstrap()
    mt = _management_table_service(db)
    return await mt.bootstrap_workspace_item(
        org_id=org_id,
        school_id=school_id,
        user_id=user.user_id,
        workspace_item_id=workspace_item_id,
    )


# —— Course Q&A (Stack Overflow–style, scoped to a course workspace item) ——


@org_router.get(
    "/{school_id}/courses/{course_workspace_item_id}/qa/questions",
    response_model=CourseQaQuestionListResponse,
    dependencies=[Depends(require_org_membership)],
)
async def list_org_course_qa_questions(
    org_id: str,
    school_id: str,
    course_workspace_item_id: str,
    q: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> CourseQaQuestionListResponse:
    qa = _course_qa_service(db)
    await qa.bootstrap()
    can_manage = await _user_can_manage_school(db=db, org_id=org_id, user_id=user.user_id)
    return await qa.list_questions(
        org_id=org_id,
        school_id=school_id,
        course_workspace_item_id=course_workspace_item_id,
        viewer_user_id=user.user_id,
        can_manage=can_manage,
        q=q,
        tag=tag,
    )


@org_router.post(
    "/{school_id}/courses/{course_workspace_item_id}/qa/questions",
    response_model=CourseQaQuestionPublic,
    dependencies=[Depends(require_org_membership)],
)
async def create_org_course_qa_question(
    org_id: str,
    school_id: str,
    course_workspace_item_id: str,
    payload: CourseQaQuestionCreateInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> CourseQaQuestionPublic:
    qa = _course_qa_service(db)
    await qa.bootstrap()
    return await qa.create_question(
        org_id=org_id,
        school_id=school_id,
        course_workspace_item_id=course_workspace_item_id,
        user_id=user.user_id,
        payload=payload,
    )


@org_router.get(
    "/{school_id}/courses/{course_workspace_item_id}/qa/questions/{question_id}",
    response_model=CourseQaQuestionDetailPublic,
    dependencies=[Depends(require_org_membership)],
)
async def get_org_course_qa_question(
    org_id: str,
    school_id: str,
    course_workspace_item_id: str,
    question_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> CourseQaQuestionDetailPublic:
    qa = _course_qa_service(db)
    await qa.bootstrap()
    can_manage = await _user_can_manage_school(db=db, org_id=org_id, user_id=user.user_id)
    return await qa.get_question(
        org_id=org_id,
        school_id=school_id,
        course_workspace_item_id=course_workspace_item_id,
        question_id=question_id,
        viewer_user_id=user.user_id,
        can_manage=can_manage,
        increment_view=True,
    )


@org_router.patch(
    "/{school_id}/courses/{course_workspace_item_id}/qa/questions/{question_id}",
    response_model=CourseQaQuestionPublic,
    dependencies=[Depends(require_org_membership)],
)
async def update_org_course_qa_question(
    org_id: str,
    school_id: str,
    course_workspace_item_id: str,
    question_id: str,
    payload: CourseQaQuestionUpdateInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> CourseQaQuestionPublic:
    qa = _course_qa_service(db)
    await qa.bootstrap()
    can_manage = await _user_can_manage_school(db=db, org_id=org_id, user_id=user.user_id)
    return await qa.update_question(
        org_id=org_id,
        school_id=school_id,
        course_workspace_item_id=course_workspace_item_id,
        question_id=question_id,
        user_id=user.user_id,
        can_manage=can_manage,
        payload=payload,
    )


@org_router.post(
    "/{school_id}/courses/{course_workspace_item_id}/qa/questions/{question_id}/vote",
    response_model=CourseQaQuestionPublic,
    dependencies=[Depends(require_org_membership)],
)
async def vote_org_course_qa_question(
    org_id: str,
    school_id: str,
    course_workspace_item_id: str,
    question_id: str,
    payload: CourseQaVoteInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> CourseQaQuestionPublic:
    qa = _course_qa_service(db)
    await qa.bootstrap()
    return await qa.vote_question(
        org_id=org_id,
        school_id=school_id,
        course_workspace_item_id=course_workspace_item_id,
        question_id=question_id,
        user_id=user.user_id,
        payload=payload,
    )


@org_router.post(
    "/{school_id}/courses/{course_workspace_item_id}/qa/questions/{question_id}/bookmark",
    response_model=CourseQaQuestionPublic,
    dependencies=[Depends(require_org_membership)],
)
async def bookmark_org_course_qa_question(
    org_id: str,
    school_id: str,
    course_workspace_item_id: str,
    question_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> CourseQaQuestionPublic:
    qa = _course_qa_service(db)
    await qa.bootstrap()
    return await qa.bookmark_question(
        org_id=org_id,
        school_id=school_id,
        course_workspace_item_id=course_workspace_item_id,
        question_id=question_id,
        user_id=user.user_id,
    )


@org_router.post(
    "/{school_id}/courses/{course_workspace_item_id}/qa/questions/{question_id}/answers",
    response_model=CourseQaAnswerPublic,
    dependencies=[Depends(require_org_membership)],
)
async def create_org_course_qa_answer(
    org_id: str,
    school_id: str,
    course_workspace_item_id: str,
    question_id: str,
    payload: CourseQaAnswerCreateInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> CourseQaAnswerPublic:
    qa = _course_qa_service(db)
    await qa.bootstrap()
    return await qa.create_answer(
        org_id=org_id,
        school_id=school_id,
        course_workspace_item_id=course_workspace_item_id,
        question_id=question_id,
        user_id=user.user_id,
        payload=payload,
    )


@org_router.patch(
    "/{school_id}/courses/{course_workspace_item_id}/qa/answers/{answer_id}",
    response_model=CourseQaAnswerPublic,
    dependencies=[Depends(require_org_membership)],
)
async def update_org_course_qa_answer(
    org_id: str,
    school_id: str,
    course_workspace_item_id: str,
    answer_id: str,
    payload: CourseQaAnswerUpdateInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> CourseQaAnswerPublic:
    del course_workspace_item_id  # path keeps course scope consistent with siblings
    qa = _course_qa_service(db)
    await qa.bootstrap()
    can_manage = await _user_can_manage_school(db=db, org_id=org_id, user_id=user.user_id)
    return await qa.update_answer(
        org_id=org_id,
        school_id=school_id,
        answer_id=answer_id,
        user_id=user.user_id,
        can_manage=can_manage,
        payload=payload,
    )


@org_router.post(
    "/{school_id}/courses/{course_workspace_item_id}/qa/answers/{answer_id}/vote",
    response_model=CourseQaAnswerPublic,
    dependencies=[Depends(require_org_membership)],
)
async def vote_org_course_qa_answer(
    org_id: str,
    school_id: str,
    course_workspace_item_id: str,
    answer_id: str,
    payload: CourseQaVoteInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> CourseQaAnswerPublic:
    del course_workspace_item_id
    qa = _course_qa_service(db)
    await qa.bootstrap()
    return await qa.vote_answer(
        org_id=org_id,
        school_id=school_id,
        answer_id=answer_id,
        user_id=user.user_id,
        payload=payload,
    )


@org_router.post(
    "/{school_id}/courses/{course_workspace_item_id}/qa/questions/{question_id}/answers/{answer_id}/approve",
    response_model=CourseQaQuestionDetailPublic,
    dependencies=[Depends(require_org_membership)],
)
async def approve_org_course_qa_answer(
    org_id: str,
    school_id: str,
    course_workspace_item_id: str,
    question_id: str,
    answer_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> CourseQaQuestionDetailPublic:
    qa = _course_qa_service(db)
    await qa.bootstrap()
    can_manage = await _user_can_manage_school(db=db, org_id=org_id, user_id=user.user_id)
    return await qa.approve_answer(
        org_id=org_id,
        school_id=school_id,
        course_workspace_item_id=course_workspace_item_id,
        question_id=question_id,
        answer_id=answer_id,
        user_id=user.user_id,
        can_manage=can_manage,
    )


@org_router.post(
    "/{school_id}/courses/{course_workspace_item_id}/qa/answers/{answer_id}/comments",
    response_model=CourseQaAnswerPublic,
    dependencies=[Depends(require_org_membership)],
)
async def comment_org_course_qa_answer(
    org_id: str,
    school_id: str,
    course_workspace_item_id: str,
    answer_id: str,
    payload: CourseQaCommentCreateInput,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> CourseQaAnswerPublic:
    del course_workspace_item_id
    qa = _course_qa_service(db)
    await qa.bootstrap()
    return await qa.comment_on_answer(
        org_id=org_id,
        school_id=school_id,
        answer_id=answer_id,
        user_id=user.user_id,
        payload=payload,
    )


# ################################ /ROUTES ################################
