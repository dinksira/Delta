"""Playback / CDN URL helpers for media assets."""

from __future__ import annotations

from urllib.parse import quote

from app.core.config import Settings


def build_media_playback_url(*, settings: Settings, object_key: str) -> str:
    """Public (or API-served) URL for progressive playback until HLS transcoder exists."""
    provider = settings.media_storage_provider.strip().lower()
    cleaned = object_key.strip().lstrip("/")
    encoded = quote(cleaned, safe="/")
    if provider == "local" or (
        settings.env == "local"
        and not (settings.media_s3_access_key_id or "").strip()
    ):
        base = settings.media_cdn_base_url.rstrip("/") or settings.media_upload_base_url.rstrip("/")
        prefix = settings.api_v1_prefix.rstrip("/")
        return f"{base}{prefix}/media/objects/{encoded}"
    cdn = settings.media_cdn_base_url.rstrip("/")
    return f"{cdn}/{encoded}"
