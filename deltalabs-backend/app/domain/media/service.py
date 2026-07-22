"""Media service for upload intents, complete, and ingest callbacks."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from app.core.config import get_settings
from app.core.exceptions import NotFoundError, PermissionDeniedError, ValidationError
from app.domain.media.repository import Repository
from app.domain.media.schemas import (
    MediaCompleteUploadResponse,
    MediaIngestCallbackRequest,
    MediaIngestCallbackResponse,
    MediaPublic,
    MediaUploadIntentRequest,
    MediaUploadIntentResponse,
)
from app.infra.media_signer import sign_media_upload_put_url
from app.infra.media_urls import build_media_playback_url


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
                "playback_url": None,
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

    async def complete_upload_for_org(
        self,
        *,
        org_id: str,
        media_id: str,
        owner_user_id: str | None = None,
    ) -> MediaCompleteUploadResponse:
        """Mark source upload complete and publish progressive playback URL (pre-HLS)."""
        settings = get_settings()
        doc = await self._repository.find_media_asset(media_id=media_id, org_id=org_id)
        if doc is None:
            raise NotFoundError("Media asset not found.", code="media_not_found")
        if owner_user_id and str(doc.get("owner_user_id")) != owner_user_id:
            # Org members may complete; owner check is soft — org membership is gate on route.
            pass
        if not settings.media_auto_complete_after_upload:
            playback = str(doc.get("playback_url") or doc.get("hls_url") or "")
            return MediaCompleteUploadResponse(
                media_id=media_id,
                status=str(doc.get("status", "upload_pending")),
                playback_url=playback,
                publish_to_feed=bool(doc.get("publish_to_feed", False)),
            )
        updated = await self.mark_source_ready(media_doc=doc)
        return MediaCompleteUploadResponse(
            media_id=media_id,
            status=str(updated.get("status", "ready")),
            playback_url=str(updated.get("playback_url") or updated.get("hls_url") or ""),
            publish_to_feed=bool(updated.get("publish_to_feed", False)),
        )

    async def mark_source_ready_by_object_key(self, *, object_key: str) -> dict[str, object] | None:
        doc = await self._repository.find_media_asset_by_object_key(object_key=object_key)
        if doc is None:
            return None
        settings = get_settings()
        if not settings.media_auto_complete_after_upload:
            return doc
        return await self.mark_source_ready(media_doc=doc)

    async def mark_source_ready(self, *, media_doc: dict[str, object]) -> dict[str, object]:
        settings = get_settings()
        media_id = str(media_doc["_id"])
        object_key = str(media_doc.get("upload_object_key") or "")
        playback_url = build_media_playback_url(settings=settings, object_key=object_key)
        updated = await self._repository.update_media_asset(
            media_id=media_id,
            set_fields={
                "status": "ready",
                "playback_url": playback_url,
                # Until a real transcoder exists, progressive MP4 is the playback source.
                "hls_url": playback_url,
                "ingest_error": None,
            },
        )
        if updated is None:
            raise NotFoundError("Media asset not found.", code="media_not_found")
        if bool(updated.get("publish_to_feed")):
            await self._repository.upsert_feed_item_for_media(media_doc=updated)
        return updated

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
        if payload.manifest_hls_url:
            update_fields["playback_url"] = payload.manifest_hls_url
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
