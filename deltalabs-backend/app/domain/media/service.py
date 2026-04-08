"""Media service for upload intents and ingest callbacks."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from app.core.config import get_settings
from app.core.exceptions import NotFoundError, PermissionDeniedError, ValidationError
from app.domain.media.repository import Repository
from app.domain.media.schemas import (
    MediaIngestCallbackRequest,
    MediaIngestCallbackResponse,
    MediaPublic,
    MediaUploadIntentRequest,
    MediaUploadIntentResponse,
)
from app.infra.media_signer import sign_media_upload_put_url


# ################################ SERVICE ################################
# Business logic for media upload + ingest pipeline contracts.
class Service:
    def __init__(self, repository: Repository) -> None:
        self._repository = repository

    async def bootstrap_indexes(self) -> None:
        await self._repository.ensure_indexes()

    async def create_upload_intent(
        self,
        *,
        org_id: str,
        owner_user_id: str,
        payload: MediaUploadIntentRequest,
    ) -> MediaUploadIntentResponse:
        settings = get_settings()
        media_id = str(uuid4())
        extension = _extension_from_filename(payload.filename)
        object_key = f"org/{org_id}/media/{media_id}/source.{extension}"
        signed_upload = sign_media_upload_put_url(
            settings=settings,
            object_key=object_key,
            content_type=payload.content_type,
        )
        now = datetime.now(UTC)
        await self._repository.insert_media_asset(
            {
                "_id": media_id,
                "org_id": org_id,
                "owner_user_id": owner_user_id,
                "source_filename": payload.filename,
                "source_content_type": payload.content_type,
                "file_size_bytes": payload.file_size_bytes,
                "caption": payload.caption,
                "hashtags": payload.hashtags,
                "visibility": payload.visibility,
                "publish_to_feed": payload.publish_to_feed,
                "status": "upload_pending",
                "upload_object_key": object_key,
                "upload_url_fallback": signed_upload.upload_url,
                "hls_url": None,
                "poster_url": None,
                "duration_seconds": None,
                "renditions": [],
                "created_at": now,
                "updated_at": now,
            }
        )
        return MediaUploadIntentResponse(
            media_id=media_id,
            object_key=object_key,
            upload_url=signed_upload.upload_url,
            expires_in_seconds=signed_upload.expires_in_seconds,
            provider=settings.media_storage_provider,
            bucket=settings.media_storage_bucket,
        )

    async def get_media_for_org(self, *, org_id: str, media_id: str) -> MediaPublic:
        doc = await self._repository.find_media_asset(media_id=media_id, org_id=org_id)
        if doc is None:
            raise NotFoundError("Media asset not found.", code="media_not_found")
        return Repository.doc_to_media_public(doc)

    async def process_ingest_callback(
        self,
        *,
        payload: MediaIngestCallbackRequest,
        callback_secret: str | None,
    ) -> MediaIngestCallbackResponse:
        settings = get_settings()
        expected = settings.media_ingest_shared_secret.strip()
        if not expected:
            raise ValidationError(
                "Media ingest secret is not configured.",
                code="media_ingest_secret_not_configured",
            )
        if callback_secret != expected:
            raise PermissionDeniedError(
                "Invalid ingest callback secret.", code="media_ingest_forbidden"
            )

        media_doc = await self._repository.find_media_asset(media_id=payload.media_id)
        if media_doc is None:
            raise NotFoundError("Media asset not found.", code="media_not_found")

        update_fields: dict[str, object] = {
            "status": payload.status,
            "duration_seconds": payload.duration_seconds,
            "hls_url": payload.manifest_hls_url,
            "poster_url": payload.poster_url,
            "renditions": [item.model_dump(by_alias=True) for item in payload.renditions],
            "ingest_error": payload.error_message,
        }
        updated = await self._repository.update_media_asset(
            media_id=payload.media_id,
            set_fields=update_fields,
        )
        if updated is None:
            raise NotFoundError("Media asset not found.", code="media_not_found")
        if payload.status == "ready" and bool(updated.get("publish_to_feed")):
            await self._repository.upsert_feed_item_for_media(media_doc=updated)
        return MediaIngestCallbackResponse(media_id=payload.media_id, status=payload.status)


def _extension_from_filename(filename: str) -> str:
    cleaned = filename.rsplit(".", maxsplit=1)
    if len(cleaned) == 2 and cleaned[1].strip():
        return cleaned[1].strip().lower()[:8]
    return "bin"


# ################################ /SERVICE ################################
