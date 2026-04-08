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
        return docs[:limit], False

    async def count_public_items(self, *, content_type: str | None) -> int:
        return 8

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
