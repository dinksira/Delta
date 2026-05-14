"""Unit tests for feed personalization helper behavior."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from app.domain.content.repository import encode_feed_cursor
from app.domain.content.service import Service


class _Repo:
    async def ensure_indexes(self) -> None:
        return None

    async def ping(self) -> bool:
        return True

    async def list_public_items(
        self,
        *,
        limit: int,
        cursor: tuple[datetime, str] | None,
        content_type: str | None,
        exclude_content_ids: set[str] | None = None,
        hashtag: str | None = None,
        min_duration_s: int | None = None,
        max_duration_s: int | None = None,
        course_category: str | None = None,
    ) -> tuple[list[dict[str, Any]], bool]:
        base = datetime(2026, 1, 1, tzinfo=UTC)
        docs: list[dict[str, Any]] = []
        for idx in range(8):
            docs.append(
                {
                    "_id": f"c{idx + 1}",
                    "created_at": base - timedelta(seconds=idx),
                    "hashtags": ["ai"] if idx % 2 == 0 else ["biology"],
                    "video_src": "",
                    "media_tone": 0,
                    "caption": "",
                    "pdf_label": "",
                    "like_count": "0",
                }
            )
        if exclude_content_ids:
            docs = [doc for doc in docs if str(doc.get("_id", "")) not in exclude_content_ids]
        return docs[:limit], False

    async def count_public_items(
        self,
        *,
        content_type: str | None,
        hashtag: str | None = None,
        min_duration_s: int | None = None,
        max_duration_s: int | None = None,
        course_category: str | None = None,
    ) -> int:
        return 8

    async def list_like_counts(self, *, item_ids: list[str]) -> dict[str, int]:
        return {iid: 0 for iid in item_ids}

    async def list_save_counts(self, *, item_ids: list[str]) -> dict[str, int]:
        return {iid: 0 for iid in item_ids}

    async def list_comment_counts(self, *, item_ids: list[str]) -> dict[str, int]:
        return {iid: 0 for iid in item_ids}

    async def list_share_counts(self, *, item_ids: list[str]) -> dict[str, int]:
        return {iid: 0 for iid in item_ids}

    async def list_user_liked_ids(self, *, user_id: str, item_ids: list[str]) -> set[str]:
        return set()

    async def list_user_saved_ids(self, *, user_id: str, item_ids: list[str]) -> set[str]:
        return set()

    async def find_public_by_id(self, item_id: str) -> dict[str, Any] | None:
        return None

    async def list_recent_user_engaged_item_ids(
        self, *, user_id: str, limit: int = 120
    ) -> list[str]:
        if user_id == "u-ai":
            return ["c1", "c3", "c5"]
        return []

    async def list_hashtag_rows_for_item_ids(self, *, item_ids: list[str]) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for item_id in item_ids:
            rows.append({"_id": item_id, "hashtags": ["ai"]})
        return rows

    async def list_recent_user_events(
        self, *, user_id: str, limit: int = 300
    ) -> list[dict[str, Any]]:
        if user_id == "u-ai":
            return [
                {"content_id": "c1", "event": "view_complete", "watch_ms": 38_000},
                {"content_id": "c3", "event": "view_complete", "watch_ms": 42_000},
                {"content_id": "c2", "event": "skip", "watch_ms": 1_000},
            ]
        return []


async def test_feed_personalization_changes_order_for_engaged_user() -> None:
    service = Service(_Repo())  # type: ignore[arg-type]
    result = await service.list_feed(
        limit=6, cursor_token=None, content_type="video", user_id="u-ai"
    )
    ids = [item.id for item in result.items]
    assert ids != ["c1", "c2", "c3", "c4", "c5", "c6"]
    assert ids[0] in {"c1", "c3", "c5"}


async def test_feed_cold_start_personalization_is_deterministic() -> None:
    service = Service(_Repo())  # type: ignore[arg-type]
    cursor_token = encode_feed_cursor(created_at=datetime(2026, 1, 1, tzinfo=UTC), item_id="c1")
    first = await service.list_feed(
        limit=6,
        cursor_token=cursor_token,
        content_type="video",
        user_id="u-cold",
    )
    second = await service.list_feed(
        limit=6,
        cursor_token=cursor_token,
        content_type="video",
        user_id="u-cold",
    )
    assert [item.id for item in first.items] == [item.id for item in second.items]


async def test_feed_hidden_event_excludes_item() -> None:
    class _RepoWithHide(_Repo):
        async def list_recent_user_events(
            self, *, user_id: str, limit: int = 300
        ) -> list[dict[str, Any]]:
            return [{"content_id": "c1", "event": "hide", "watch_ms": 0}]

    service = Service(_RepoWithHide())  # type: ignore[arg-type]
    result = await service.list_feed(
        limit=6, cursor_token=None, content_type="video", user_id="u-hide"
    )
    ids = [item.id for item in result.items]
    assert "c1" not in ids


async def test_feed_watched_items_are_deprioritized_or_excluded() -> None:
    class _RepoWithWatched(_Repo):
        async def list_recent_user_events(
            self, *, user_id: str, limit: int = 300
        ) -> list[dict[str, Any]]:
            return [{"content_id": "c1", "event": "view_complete", "watch_ms": 33_000}]

    service = Service(_RepoWithWatched())  # type: ignore[arg-type]
    result = await service.list_feed(
        limit=6, cursor_token=None, content_type="video", user_id="u-watch"
    )
    ids = [item.id for item in result.items]
    assert "c1" not in ids


async def test_event_signal_thresholds_mark_watched_items() -> None:
    service = Service(_Repo())  # type: ignore[arg-type]
    boosts, hidden_ids, watched_ids = service._event_boosts_hidden_and_watched(  # noqa: SLF001
        [
            {"content_id": "c9", "event": "view_start", "watch_ms": 1_000},
            {"content_id": "c10", "event": "skip", "watch_ms": 2_000},
            {"content_id": "c11", "event": "view_complete", "watch_ms": 8_000},
            {"content_id": "c12", "event": "view_start", "watch_ms": 25_000},
            {"content_id": "c13", "event": "hide", "watch_ms": 0},
        ]
    )

    assert "c13" in hidden_ids
    assert watched_ids == {"c11", "c12"}
    assert boosts["c10"] < 0
    assert boosts["c11"] > boosts["c9"]


async def test_feed_falls_back_when_exclusions_would_empty_page() -> None:
    class _RepoAllExcluded(_Repo):
        async def list_recent_user_events(
            self, *, user_id: str, limit: int = 300
        ) -> list[dict[str, Any]]:
            return [{"content_id": f"c{idx + 1}", "event": "view_complete"} for idx in range(8)]

    service = Service(_RepoAllExcluded())  # type: ignore[arg-type]
    result = await service.list_feed(
        limit=6,
        cursor_token=None,
        content_type="video",
        user_id="u-all-excluded",
    )
    assert len(result.items) > 0
