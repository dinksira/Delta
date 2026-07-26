"""Pydantic models for course Fast Summary."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


CourseSummaryStatus = Literal["draft", "published", "deleted"]
CourseSummaryLayout = Literal["stack", "split"]


class CourseSummaryAuthorPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str = Field(serialization_alias="userId")
    username: str
    full_name: str | None = Field(default=None, serialization_alias="fullName")
    avatar_url: str | None = Field(default=None, serialization_alias="avatarUrl")


class CourseSummaryPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    school_id: str = Field(serialization_alias="schoolId")
    course_workspace_item_id: str = Field(serialization_alias="courseWorkspaceItemId")
    title: str
    summary_type: str = Field(default="academic", serialization_alias="summaryType")
    section: str = Field(default="")
    layout: CourseSummaryLayout = "split"
    body_html: str = Field(default="", serialization_alias="bodyHtml")
    status: CourseSummaryStatus = "draft"
    org_label: str = Field(default="", serialization_alias="orgLabel")
    read_minutes: int | None = Field(default=None, serialization_alias="readMinutes")
    ghost_id: str | None = Field(default=None, serialization_alias="ghostId")
    created_by: CourseSummaryAuthorPublic = Field(serialization_alias="createdBy")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class CourseSummaryListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[CourseSummaryPublic]
    total: int


class CourseSummaryCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(default="New Summary", min_length=1, max_length=200)
    summary_type: str = Field(default="academic", alias="summaryType", max_length=80)
    section: str = Field(default="", max_length=120)
    layout: CourseSummaryLayout = "split"
    body_html: str = Field(default="", alias="bodyHtml", max_length=200_000)
    status: CourseSummaryStatus = "draft"
    org_label: str = Field(default="", alias="orgLabel", max_length=120)
    read_minutes: int | None = Field(default=None, alias="readMinutes", ge=0, le=24 * 60)


class CourseSummaryUpdateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str | None = Field(default=None, min_length=1, max_length=200)
    summary_type: str | None = Field(default=None, alias="summaryType", max_length=80)
    section: str | None = Field(default=None, max_length=120)
    layout: CourseSummaryLayout | None = None
    body_html: str | None = Field(default=None, alias="bodyHtml", max_length=200_000)
    status: CourseSummaryStatus | None = None
    org_label: str | None = Field(default=None, alias="orgLabel", max_length=120)
    read_minutes: int | None = Field(default=None, alias="readMinutes", ge=0, le=24 * 60)
