"""Pydantic models for unified search responses."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.domain.content.schemas import FeedItemPublic


class SearchUserHit(BaseModel):
    """Public user row surfaced in search (no secrets)."""

    id: str
    username: str
    relevance: float = 0.0


class GlobalSearchResponse(BaseModel):
    """Mixed-type search payload for the standalone search UI."""

    q: str
    tab: str
    algorithm_version: str = Field(
        default="dl-search-v0",
        description="Version token for ranking; clients may log or display in debug.",
    )
    users: list[SearchUserHit]
    videos: list[FeedItemPublic]
    audio: list[FeedItemPublic]
    simulations: list[FeedItemPublic]
