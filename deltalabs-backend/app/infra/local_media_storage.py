"""Local filesystem helpers for MEDIA_STORAGE_PROVIDER=local."""

from __future__ import annotations

from pathlib import Path

from app.core.config import Settings
from app.core.exceptions import ValidationError


def resolve_local_media_path(*, settings: Settings, object_key: str) -> Path:
    """Map an object key to a path under media_local_root; reject path traversal."""
    cleaned = object_key.strip().lstrip("/")
    if not cleaned or ".." in cleaned.split("/"):
        raise ValidationError("Invalid media object key.", code="media_object_key_invalid")
    root = Path(settings.media_local_root).expanduser().resolve()
    target = (root / cleaned).resolve()
    try:
        target.relative_to(root)
    except ValueError as exc:
        raise ValidationError("Invalid media object key.", code="media_object_key_invalid") from exc
    return target


def write_local_media_bytes(*, settings: Settings, object_key: str, body: bytes) -> Path:
    path = resolve_local_media_path(settings=settings, object_key=object_key)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(body)
    return path
