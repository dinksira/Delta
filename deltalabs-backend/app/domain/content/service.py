"""Content service — feed read model."""

from __future__ import annotations

import hashlib
import random
from collections import Counter
from datetime import UTC
from typing import Any

from app.core.config import get_settings
from app.core.exceptions import NotFoundError, ValidationError
from app.domain.content.repository import Repository, decode_feed_cursor, encode_feed_cursor
from app.domain.content.schemas import FeedItemPublic, FeedPaginatedResponse


class Service:
    """Business logic for public feed listing and item detail."""

    # ################################ SERVICE ################################
    def __init__(self, repository: Repository) -> None:
        self._repository = repository

    async def healthcheck(self) -> bool:
        """Placeholder service method used by foundation tests."""
        return await self._repository.ping()

    async def bootstrap_indexes(self) -> None:
        """Ensure indexes and optional local demo data."""
        await self._repository.ensure_indexes()
        settings = get_settings()
        if settings.env == "local":
            await self._repository.insert_demo_items_if_empty()

    async def list_feed(
        self,
        *,
        limit: int,
        cursor_token: str | None,
        content_type: str | None,
        user_id: str | None = None,
    ) -> FeedPaginatedResponse:
        """Cursor-paginated public feed."""
        cursor_tuple = None
        if cursor_token:
            decoded = decode_feed_cursor(cursor_token)
            if decoded is None:
                raise ValidationError("Invalid feed cursor.", code="feed_cursor_invalid")
            cursor_tuple = decoded

        docs, has_more = await self._repository.list_public_items(
            limit=limit,
            cursor=cursor_tuple,
            content_type=content_type,
        )
        docs = await self._personalize_docs(
            docs=docs,
            user_id=user_id,
            content_type=content_type,
            cursor_token=cursor_token,
        )
        items = [Repository.doc_to_feed_item(doc) for doc in docs]
        next_cursor = None
        if has_more and docs:
            last = docs[-1]
            created_at = last["created_at"]
            if hasattr(created_at, "replace") and getattr(created_at, "tzinfo", None) is None:
                created_at = created_at.replace(tzinfo=UTC)
            next_cursor = encode_feed_cursor(
                created_at=created_at,
                item_id=str(last["_id"]),
            )

        total = await self._repository.count_public_items(content_type=content_type)
        return FeedPaginatedResponse(
            items=items,
            total=total,
            next_cursor=next_cursor,
            has_more=has_more,
        )

    async def get_feed_item(self, item_id: str) -> FeedItemPublic:
        """Return a single public feed item."""
        doc = await self._repository.find_public_by_id(item_id)
        if doc is None:
            raise NotFoundError("Feed item not found.", code="feed_item_not_found")
        return Repository.doc_to_feed_item(doc)

    async def _personalize_docs(
        self,
        *,
        docs: list[dict[str, Any]],
        user_id: str | None,
        content_type: str | None,
        cursor_token: str | None,
    ) -> list[dict[str, Any]]:
        """Per-user rerank helper for FYP-style variance without changing feed contract."""
        if not docs or not user_id:
            return docs

        engaged_ids = await self._repository.list_recent_user_engaged_item_ids(user_id=user_id)
        if not engaged_ids:
            return self._stable_user_shuffle(docs=docs, user_id=user_id, cursor_token=cursor_token)

        hashtag_weights = await self._build_hashtag_weights(engaged_ids=engaged_ids)
        if not hashtag_weights:
            return self._stable_user_shuffle(docs=docs, user_id=user_id, cursor_token=cursor_token)

        scoped_type = content_type or "all"
        scored: list[tuple[float, dict[str, Any]]] = []
        total = max(len(docs), 1)
        for idx, doc in enumerate(docs):
            recency_score = (total - idx) / total
            hashtag_score = 0.0
            for tag in doc.get("hashtags", []):
                hashtag_score += hashtag_weights.get(str(tag).lower(), 0.0)
            jitter = _seeded_unit_interval(
                f"{user_id}:{scoped_type}:{cursor_token or 'first'}:{doc.get('_id', '')}",
            )
            score = (0.65 * recency_score) + (0.3 * hashtag_score) + (0.05 * jitter)
            scored.append((score, doc))

        scored.sort(
            key=lambda pair: (
                pair[0],
                str(pair[1].get("created_at", "")),
                str(pair[1].get("_id", "")),
            ),
            reverse=True,
        )
        return [doc for _, doc in scored]

    async def _build_hashtag_weights(self, *, engaged_ids: list[str]) -> dict[str, float]:
        """Build normalized hashtag preference weights from recent user engagement."""
        if not engaged_ids:
            return {}
        rows = await self._repository.list_hashtag_rows_for_item_ids(item_ids=engaged_ids)
        counts: Counter[str] = Counter()
        for row in rows:
            for tag in row.get("hashtags", []):
                normalized = str(tag).strip().lower()
                if normalized:
                    counts[normalized] += 1
        if not counts:
            return {}
        max_count = max(counts.values())
        return {tag: value / max_count for tag, value in counts.items()}

    def _stable_user_shuffle(
        self,
        *,
        docs: list[dict[str, Any]],
        user_id: str,
        cursor_token: str | None,
    ) -> list[dict[str, Any]]:
        """Deterministic per-user order for cold-start users."""
        seed = int(
            hashlib.sha256(f"{user_id}:{cursor_token or 'first'}".encode()).hexdigest()[:16],
            16,
        )
        ordered = docs.copy()
        random.Random(seed).shuffle(ordered)
        return ordered


def _seeded_unit_interval(seed_text: str) -> float:
    """Deterministic pseudo-random float in [0, 1) based on text seed."""
    raw = hashlib.sha256(seed_text.encode("utf-8")).digest()[:8]
    integer = int.from_bytes(raw, "big", signed=False)
    return integer / float(2**64)


# ################################ /SERVICE ################################
