"""Business logic for custom feed tab configuration."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status

from app.domain.feed_custom_tab.repository import Repository
from app.domain.feed_custom_tab.schemas import (
    FeedCustomTabFilters,
    FeedCustomTabResponse,
    FeedCustomTabUpsertRequest,
)

_FEED_COURSE_CATEGORIES = frozenset({"research", "lab", "course"})
_FEED_CONTENT_TYPES = frozenset({"video", "audio", "simulation"})


class Service:
    def __init__(self, repository: Repository) -> None:
        self._repo = repository

    async def bootstrap_indexes(self) -> None:
        await self._repo.ensure_indexes()

    async def get_for_user(self, *, user_id: str) -> FeedCustomTabResponse | None:
        doc = await self._repo.find_by_user_id(user_id=user_id)
        if doc is None:
            return None
        return self._to_response(doc)

    async def upsert_for_user(
        self,
        *,
        user_id: str,
        payload: FeedCustomTabUpsertRequest,
    ) -> FeedCustomTabResponse:
        normalized_filters = self._normalize_filters(payload.filters)
        label = str(payload.label).strip()
        if not label:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "feed_custom_tab_label_required"},
            )
        doc = await self._repo.upsert(
            user_id=user_id,
            label=label,
            filters=normalized_filters,
        )
        return self._to_response(doc)

    def _normalize_filters(self, filters: FeedCustomTabFilters) -> dict[str, Any]:
        out: dict[str, Any] = {}
        if filters.content_type is not None and str(filters.content_type).strip():
            value = str(filters.content_type).strip().lower()
            if value not in _FEED_CONTENT_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "code": "feed_custom_tab_content_type_invalid",
                        "allowed": sorted(_FEED_CONTENT_TYPES),
                    },
                )
            out["content_type"] = value

        if filters.hashtag is not None and str(filters.hashtag).strip():
            out["hashtag"] = str(filters.hashtag).strip()

        if filters.course_category is not None and str(filters.course_category).strip():
            value = str(filters.course_category).strip().lower()
            if value not in _FEED_COURSE_CATEGORIES:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "code": "feed_custom_tab_course_category_invalid",
                        "allowed": sorted(_FEED_COURSE_CATEGORIES),
                    },
                )
            out["course_category"] = value

        min_d = filters.min_duration_s
        max_d = filters.max_duration_s
        if min_d is not None or max_d is not None:
            if min_d is not None:
                out["min_duration_s"] = int(min_d)
            if max_d is not None:
                out["max_duration_s"] = int(max_d)
            if (
                "min_duration_s" in out
                and "max_duration_s" in out
                and out["min_duration_s"] > out["max_duration_s"]
            ):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={"code": "feed_custom_tab_duration_range_invalid"},
                )

        if not out:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "feed_custom_tab_filters_required"},
            )
        return out

    def _to_response(self, doc: dict[str, Any]) -> FeedCustomTabResponse:
        raw_filters = doc.get("filters") if isinstance(doc.get("filters"), dict) else {}
        updated = doc.get("updated_at")
        if isinstance(updated, datetime) and updated.tzinfo is None:
            updated = updated.replace(tzinfo=UTC)
        return FeedCustomTabResponse(
            label=str(doc.get("label", "Custom")),
            filters=FeedCustomTabFilters.model_validate(raw_filters),
            updated_at=updated if isinstance(updated, datetime) else datetime.now(UTC),
        )
