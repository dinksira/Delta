from typing import Literal

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_db
from app.api.deps_authz import require_org_membership, require_org_permission
from app.domain.authorization.repository import Repository as AuthorizationRepository
from app.domain.authorization.schemas import PermissionCheckRequest
from app.domain.authorization.service import Service as AuthorizationService
from app.domain.school.repository import Repository
from app.domain.school.schemas import (
    OfferListView,
    MarketplaceBidInput,
    MarketplaceBuyInput,
    MarketplaceCreateInput,
    MarketplaceListResponse,
    MarketplaceViewResponse,
    MarketplaceSortBy,
    MarketplaceSortDirection,
    MarketplaceUpdateInput,
    OfferCreateInput,
    OfferListResponse,
    OfferPublic,
    OfferStatusUpdateInput,
    SchoolArchiveInput,
    SchoolArchiveResponse,
    SchoolCreateInput,
    SchoolCreateMeInput,
    SchoolListResponse,
    SchoolPublic,
)
from app.domain.school.service import Service

# ################################ CONSTANTS ################################
# Router declarations for school APIs.
router = APIRouter(prefix="/schools", tags=["schools"])
org_router = APIRouter(prefix="/orgs/{org_id}/schools", tags=["schools"])
# ################################ /CONSTANTS ################################


def _service(db: AsyncIOMotorDatabase[dict[str, object]]) -> Service:
    return Service(Repository(db))


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


# ################################ /ROUTES ################################
