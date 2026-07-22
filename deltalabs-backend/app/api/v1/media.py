"""Media upload and ingest pipeline endpoints."""

from __future__ import annotations

import mimetypes

from fastapi import APIRouter, Depends, Header, Query, Request, Response
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_db
from app.api.deps_authz import require_org_membership
from app.core.config import get_settings
from app.core.exceptions import PermissionDeniedError, ValidationError
from app.domain.media.repository import Repository as MediaRepository
from app.domain.media.schemas import (
    MediaCompleteUploadResponse,
    MediaIngestCallbackRequest,
    MediaIngestCallbackResponse,
    MediaPublic,
    MediaUploadIntentRequest,
    MediaUploadIntentResponse,
)
from app.domain.media.service import Service as MediaService
from app.infra.local_media_storage import resolve_local_media_path, write_local_media_bytes
from app.infra.media_signer import verify_local_upload_signature

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


@org_router.post("/{media_id}/complete", response_model=MediaCompleteUploadResponse)
async def complete_media_upload(
    org_id: str,
    media_id: str,
    _membership: None = Depends(require_org_membership),  # noqa: B008
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> MediaCompleteUploadResponse:
    """Client calls this after a successful direct PUT to object storage."""
    service = _media_service(db)
    await service.bootstrap_indexes()
    return await service.complete_upload_for_org(
        org_id=org_id,
        media_id=media_id,
        owner_user_id=user.user_id,
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


@router.put("/local-upload/{object_key:path}")
async def put_local_media_upload(
    object_key: str,
    request: Request,
    expires: int = Query(..., ge=1),
    sig: str = Query(..., min_length=16),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> Response:
    """Dev/local direct upload target (HMAC-signed URL from upload-intent)."""
    settings = get_settings()
    if settings.env not in {"local", "staging"} and settings.media_storage_provider.strip().lower() != "local":
        raise PermissionDeniedError(
            "Local media upload is disabled in this environment.",
            code="media_local_upload_disabled",
        )
    if not verify_local_upload_signature(
        settings=settings,
        object_key=object_key,
        expires_at=expires,
        signature=sig,
    ):
        raise PermissionDeniedError(
            "Invalid or expired local upload signature.",
            code="media_local_upload_forbidden",
        )
    body = await request.body()
    if not body:
        raise ValidationError("Empty upload body.", code="media_upload_empty")
    max_bytes = 20 * 1024 * 1024 * 1024
    if len(body) > max_bytes:
        raise ValidationError("Upload exceeds max size.", code="media_upload_too_large")
    write_local_media_bytes(settings=settings, object_key=object_key, body=body)
    service = _media_service(db)
    await service.bootstrap_indexes()
    await service.mark_source_ready_by_object_key(object_key=object_key)
    return Response(status_code=204)


@router.get("/objects/{object_key:path}")
async def get_local_media_object(object_key: str) -> FileResponse:
    """Serve local-disk media for progressive playback (CDN substitute in local mode)."""
    settings = get_settings()
    path = resolve_local_media_path(settings=settings, object_key=object_key)
    if not path.is_file():
        raise ValidationError("Media object not found.", code="media_object_not_found")
    media_type, _ = mimetypes.guess_type(str(path))
    return FileResponse(
        path,
        media_type=media_type or "application/octet-stream",
        filename=path.name,
    )


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
