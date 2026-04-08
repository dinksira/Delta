"""Media domain schemas for upload and ingestion contracts."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


# ################################ TYPES ################################
# Public DTOs for media upload + transcode ingestion flow.
class MediaUploadIntentRequest(BaseModel):
    filename: str = Field(min_length=3, max_length=255)
    content_type: str = Field(min_length=3, max_length=120)
    file_size_bytes: int = Field(ge=1, le=20 * 1024 * 1024 * 1024)
    caption: str = Field(default="", max_length=1000)
    hashtags: list[str] = Field(default_factory=list)
    visibility: Literal["public", "org", "private"] = "public"
    publish_to_feed: bool = True


class MediaUploadIntentResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    media_id: str = Field(serialization_alias="mediaId")
    object_key: str = Field(serialization_alias="objectKey")
    upload_url: str = Field(serialization_alias="uploadUrl")
    expires_in_seconds: int = Field(serialization_alias="expiresInSeconds")
    provider: str
    bucket: str


class MediaRendition(BaseModel):
    profile: Literal["240p", "480p", "720p", "1080p"]
    url: str
    bitrate_kbps: int = Field(serialization_alias="bitrateKbps", ge=1)


class MediaIngestCallbackRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    media_id: str = Field(serialization_alias="mediaId")
    status: Literal["processing", "ready", "failed"]
    duration_seconds: float | None = Field(
        default=None, serialization_alias="durationSeconds", ge=0
    )
    manifest_hls_url: str | None = Field(default=None, serialization_alias="manifestHlsUrl")
    poster_url: str | None = Field(default=None, serialization_alias="posterUrl")
    renditions: list[MediaRendition] = Field(default_factory=list)
    error_message: str | None = Field(
        default=None, serialization_alias="errorMessage", max_length=500
    )


class MediaIngestCallbackResponse(BaseModel):
    ok: bool = True
    media_id: str = Field(serialization_alias="mediaId")
    status: str


class MediaPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    owner_user_id: str = Field(serialization_alias="ownerUserId")
    source_filename: str = Field(serialization_alias="sourceFilename")
    source_content_type: str = Field(serialization_alias="sourceContentType")
    status: str
    visibility: str
    caption: str
    hashtags: list[str]
    publish_to_feed: bool = Field(serialization_alias="publishToFeed")
    upload_object_key: str = Field(serialization_alias="uploadObjectKey")
    hls_url: str | None = Field(default=None, serialization_alias="hlsUrl")
    poster_url: str | None = Field(default=None, serialization_alias="posterUrl")
    duration_seconds: float | None = Field(default=None, serialization_alias="durationSeconds")
    renditions: list[dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


# ################################ /TYPES ################################
