"""Content domain schemas for feed and related APIs."""

from pydantic import BaseModel, ConfigDict, Field


class DomainEntity(BaseModel):
    """Backward-compatible skeleton symbol for foundation tests."""

    # ################################ TYPES ################################
    id: str


class FeedItemPublic(BaseModel):
    """Single feed card payload aligned with landing feed UI."""

    id: str
    videoSrc: str
    contentType: str = "video"
    durationS: int = Field(default=0, ge=0, description="Playback length in seconds")
    mediaTone: int = Field(ge=0, le=10)
    caption: str
    hashtags: list[str]
    pdfLabel: str
    likeCount: int = 0
    saveCount: int = 0
    commentCount: int = 0
    shareCount: int = 0
    likedByMe: bool = False
    savedByMe: bool = False

    model_config = ConfigDict(populate_by_name=True)


class FeedPaginatedResponse(BaseModel):
    """Cursor-paginated feed list (BACKEND_STANDARD shape)."""

    items: list[FeedItemPublic]
    total: int
    next_cursor: str | None = None
    has_more: bool = False


# ################################ /TYPES ################################
