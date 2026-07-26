"""Pydantic models for course Supplements."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


CourseSupplementKind = Literal["pdf", "slides", "video", "audio", "other"]
CourseSupplementStatus = Literal["draft", "published", "deleted"]
CourseSupplementSource = Literal["upload", "link"]


class CourseSupplementAuthorPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str = Field(serialization_alias="userId")
    username: str
    full_name: str | None = Field(default=None, serialization_alias="fullName")
    avatar_url: str | None = Field(default=None, serialization_alias="avatarUrl")


class CourseSupplementPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    school_id: str = Field(serialization_alias="schoolId")
    course_workspace_item_id: str = Field(serialization_alias="courseWorkspaceItemId")
    title: str
    description: str = ""
    kind: CourseSupplementKind = "other"
    source: CourseSupplementSource = "upload"
    tags: list[str] = Field(default_factory=list)
    media_id: str | None = Field(default=None, serialization_alias="mediaId")
    playback_url: str = Field(default="", serialization_alias="playbackUrl")
    link_url: str = Field(default="", serialization_alias="linkUrl")
    content_type: str = Field(default="", serialization_alias="contentType")
    file_name: str = Field(default="", serialization_alias="fileName")
    status: CourseSupplementStatus = "published"
    ghost_id: str | None = Field(default=None, serialization_alias="ghostId")
    created_by: CourseSupplementAuthorPublic = Field(serialization_alias="createdBy")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class CourseSupplementListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[CourseSupplementPublic]
    total: int


class CourseSupplementCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=4000)
    kind: CourseSupplementKind | None = None
    source: CourseSupplementSource = "upload"
    tags: list[str] = Field(default_factory=list)
    media_id: str | None = Field(default=None, alias="mediaId", max_length=80)
    playback_url: str = Field(default="", alias="playbackUrl", max_length=2000)
    link_url: str = Field(default="", alias="linkUrl", max_length=2000)
    content_type: str = Field(default="", alias="contentType", max_length=160)
    file_name: str = Field(default="", alias="fileName", max_length=260)
    status: CourseSupplementStatus = "published"


class CourseSupplementUpdateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    kind: CourseSupplementKind | None = None
    tags: list[str] | None = None
    media_id: str | None = Field(default=None, alias="mediaId", max_length=80)
    playback_url: str | None = Field(default=None, alias="playbackUrl", max_length=2000)
    link_url: str | None = Field(default=None, alias="linkUrl", max_length=2000)
    content_type: str | None = Field(default=None, alias="contentType", max_length=160)
    file_name: str | None = Field(default=None, alias="fileName", max_length=260)
    status: CourseSupplementStatus | None = None
