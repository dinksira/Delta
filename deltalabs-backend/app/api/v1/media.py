"""Media upload and ingest pipeline endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_db
from app.api.deps_authz import require_org_membership
from app.domain.media.repository import Repository as MediaRepository
from app.domain.media.schemas import (
    MediaIngestCallbackRequest,
    MediaIngestCallbackResponse,
    MediaPublic,
    MediaUploadIntentRequest,
    MediaUploadIntentResponse,
)
from app.domain.media.service import Service as MediaService

# ################################ CONSTANTS ################################
# Media routers for org-scoped creator flow and ingest callbacks.
org_router = APIRouter(prefix="/orgs/{org_id}/media", tags=["media"])
router = APIRouter(prefix="/media", tags=["media"])
# ################################ /CONSTANTS ################################


# ################################ HELPERS ################################
# Internal service constructor for media endpoints.
def _media_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> MediaService:
    return MediaService(MediaRepository(db))


# ################################ /HELPERS ################################


# ################################ ROUTES ################################
# Media upload-intent and ingest callback contracts.
@org_router.post("/upload-intent", response_model=MediaUploadIntentResponse)
async def create_media_upload_intent(
    org_id: str,
    payload: MediaUploadIntentRequest,
    _membership: None = Depends(require_org_membership),  # noqa: B008
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> MediaUploadIntentResponse:
    service = _media_service(db)
    await service.bootstrap_indexes()
    return await service.create_upload_intent(
        org_id=org_id,
        owner_user_id=user.user_id,
        payload=payload,
    )


@org_router.get("/{media_id}", response_model=MediaPublic)
async def get_media_asset_for_org(
    org_id: str,
    media_id: str,
    _membership: None = Depends(require_org_membership),  # noqa: B008
    _user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> MediaPublic:
    service = _media_service(db)
    await service.bootstrap_indexes()
    return await service.get_media_for_org(org_id=org_id, media_id=media_id)


@router.post("/ingest/callback", response_model=MediaIngestCallbackResponse)
async def process_media_ingest_callback(
    payload: MediaIngestCallbackRequest,
    x_ingest_secret: str | None = Header(default=None, alias="X-Ingest-Secret"),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> MediaIngestCallbackResponse:
    service = _media_service(db)
    await service.bootstrap_indexes()
    return await service.process_ingest_callback(
        payload=payload,
        callback_secret=x_ingest_secret,
    )


# ################################ /ROUTES ################################
