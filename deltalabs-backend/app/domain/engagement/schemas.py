"""Engagement domain schemas for feed interactions."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DomainEntity(BaseModel):
    """Backward-compatible skeleton symbol for foundation tests."""

    # ################################ TYPES ################################
    id: str


class EngagementWriteResponse(BaseModel):
    """Like/save toggle response (optimistic UI contract)."""

    ok: bool = True
    action: str
    count: int
    active: bool


class CommentCreateRequest(BaseModel):
    """Body for posting a comment on a feed item."""

    body: str = Field(min_length=1, max_length=2000)


class CommentCreateResponse(BaseModel):
    """Comment create response with running count."""

    model_config = ConfigDict(populate_by_name=True)

    ok: bool = True
    action: str = "comment"
    comment_id: str
    count: int


class ShareCreateResponse(BaseModel):
    """Share increment response."""

    ok: bool = True
    action: str = "share"
    count: int


class EnrollPlaceholderResponse(BaseModel):
    """Placeholder until Course domain backs enroll from feed."""

    ok: bool = True
    action: str = "enroll"
    enrolled: bool = False
    message: str = "Enrollment from feed is not available yet."


class FeedEventCreateRequest(BaseModel):
    """Body for feed interaction telemetry events."""

    event: Literal["view_start", "view_complete", "skip", "hide"]
    watch_ms: int | None = Field(default=None, ge=0, le=60_000_000)
    position_ms: int | None = Field(default=None, ge=0, le=60_000_000)


class FeedEventCreateResponse(BaseModel):
    """Acknowledgement for feed event ingestion."""

    ok: bool = True
    action: str = "event"
    event: str


class FeedCommentPublic(BaseModel):
    """Public feed comment row."""

    id: str
    user_id: str = Field(serialization_alias="userId")
    user_name: str = Field(serialization_alias="userName")
    body: str
    created_at: str = Field(serialization_alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class FeedCommentListResponse(BaseModel):
    """List response for feed comments."""

    items: list[FeedCommentPublic]
    count: int


class FeedTelemetrySummaryResponse(BaseModel):
    """Compact feed telemetry observability snapshot."""

    event_counts: dict[str, int] = Field(serialization_alias="eventCounts")
    total_events: int = Field(serialization_alias="totalEvents")
    unique_users: int = Field(serialization_alias="uniqueUsers")
    average_watch_ms: int = Field(serialization_alias="averageWatchMs")
    hide_rate: float = Field(serialization_alias="hideRate")
    completion_rate: float = Field(serialization_alias="completionRate")

    model_config = ConfigDict(populate_by_name=True)


# ################################ /TYPES ################################
