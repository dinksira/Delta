"""Schemas for per-user custom feed tab configuration."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FeedCustomTabFilters(BaseModel):
    """Mirrors optional ``GET /v1/feed`` query filters."""

    model_config = ConfigDict(extra="forbid")

    content_type: str | None = Field(default=None, max_length=32)
    hashtag: str | None = Field(default=None, max_length=120)
    course_category: str | None = Field(default=None, max_length=32)
    min_duration_s: int | None = Field(default=None, ge=0, le=86_400)
    max_duration_s: int | None = Field(default=None, ge=0, le=86_400)


class FeedCustomTabUpsertRequest(BaseModel):
    label: str = Field(min_length=1, max_length=24)
    filters: FeedCustomTabFilters


class FeedCustomTabResponse(BaseModel):
    label: str
    filters: FeedCustomTabFilters
    updated_at: datetime
