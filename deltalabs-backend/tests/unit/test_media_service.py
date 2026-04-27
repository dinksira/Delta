"""Unit tests for media upload/ingest service contracts."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.core.exceptions import PermissionDeniedError
from app.domain.media.schemas import MediaIngestCallbackRequest, MediaUploadIntentRequest
from app.domain.media.service import Service


class _Repo:
    def __init__(self) -> None:
        self.doc: dict[str, Any] | None = None
        self.feed_published = False

    async def ensure_indexes(self) -> None:
        return None

    async def insert_media_asset(self, doc: dict[str, Any]) -> None:
        self.doc = doc

    async def find_media_asset(
        self, *, media_id: str, org_id: str | None = None
    ) -> dict[str, Any] | None:
        if self.doc is None:
            return None
        if str(self.doc.get("_id")) != media_id:
            return None
        if org_id is not None and str(self.doc.get("org_id")) != org_id:
            return None
        return self.doc

    async def update_media_asset(
        self, *, media_id: str, set_fields: dict[str, Any]
    ) -> dict[str, Any] | None:
        if self.doc is None or str(self.doc.get("_id")) != media_id:
            return None
        self.doc.update(set_fields)
        self.doc["updated_at"] = datetime.now(UTC)
        return self.doc

    async def upsert_feed_item_for_media(self, *, media_doc: dict[str, Any]) -> None:
        self.feed_published = True

    @staticmethod
    def doc_to_media_public(doc: dict[str, Any]) -> Any:
        raise NotImplementedError


async def test_create_upload_intent_contract_shape() -> None:
    repo = _Repo()
    service = Service(repo)  # type: ignore[arg-type]
    payload = MediaUploadIntentRequest(
        filename="biology.mp4",
        content_type="video/mp4",
        file_size_bytes=1024,
        caption="Intro clip",
        hashtags=["bio", "school"],
        visibility="public",
        publish_to_feed=True,
    )
    result = await service.create_upload_intent(
        org_id="org-1", owner_user_id="u-1", payload=payload
    )
    assert result.media_id
    assert "org/org-1/media/" in result.object_key
    assert result.upload_url
    assert repo.doc is not None


async def test_ingest_callback_rejects_invalid_secret() -> None:
    repo = _Repo()
    service = Service(repo)  # type: ignore[arg-type]
    payload = MediaUploadIntentRequest(
        filename="physics.mp4",
        content_type="video/mp4",
        file_size_bytes=2048,
        caption="Physics",
        hashtags=[],
        visibility="public",
        publish_to_feed=True,
    )
    created = await service.create_upload_intent(
        org_id="org-2", owner_user_id="u-2", payload=payload
    )
    callback = MediaIngestCallbackRequest(media_id=created.media_id, status="ready")
    try:
        await service.process_ingest_callback(payload=callback, callback_secret="wrong-secret")
    except PermissionDeniedError:
        assert True
    else:
        raise AssertionError("expected PermissionDeniedError")
