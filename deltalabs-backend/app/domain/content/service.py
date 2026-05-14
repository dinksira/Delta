"""Content service — feed read model."""

from __future__ import annotations

import hashlib
import random
from collections import Counter
from dataclasses import dataclass
from datetime import UTC
from typing import Any

from app.core.exceptions import NotFoundError, ValidationError
from app.domain.content.repository import Repository, decode_feed_cursor, encode_feed_cursor
from app.domain.content.schemas import FeedItemPublic, FeedPaginatedResponse


@dataclass(slots=True)
class _SignalProfile:
    hashtag_weights: dict[str, float]
    event_boosts: dict[str, float]
    hidden_ids: set[str]
    watched_ids: set[str]


class Service:
    """Business logic for public feed listing and item detail."""

    # ################################ SERVICE ################################
    def __init__(self, repository: Repository) -> None:
        self._repository = repository

    async def healthcheck(self) -> bool:
        """Placeholder service method used by foundation tests."""
        return await self._repository.ping()

    async def bootstrap_indexes(self) -> None:
        """Ensure indexes for feed content read paths."""
        await self._repository.ensure_indexes()

    async def list_feed(
        self,
        *,
        limit: int,
        cursor_token: str | None,
        content_type: str | None,
        user_id: str | None = None,
        hashtag: str | None = None,
        min_duration_s: int | None = None,
        max_duration_s: int | None = None,
        course_category: str | None = None,
    ) -> FeedPaginatedResponse:
        """Cursor-paginated public feed."""
        cursor_tuple = None
        if cursor_token:
            decoded = decode_feed_cursor(cursor_token)
            if decoded is None:
                raise ValidationError("Invalid feed cursor.", code="feed_cursor_invalid")
            cursor_tuple = decoded

        profile = await self._build_signal_profile(user_id=user_id) if user_id else None
        exclude_content_ids = None
        if profile is not None:
            exclude_content_ids = profile.hidden_ids | profile.watched_ids

        docs, has_more = await self._repository.list_public_items(
            limit=limit,
            cursor=cursor_tuple,
            content_type=content_type,
            exclude_content_ids=exclude_content_ids,
            hashtag=hashtag,
            min_duration_s=min_duration_s,
            max_duration_s=max_duration_s,
            course_category=course_category,
        )
        if not docs and exclude_content_ids:
            docs, has_more = await self._repository.list_public_items(
                limit=limit,
                cursor=cursor_tuple,
                content_type=content_type,
                exclude_content_ids=None,
                hashtag=hashtag,
                min_duration_s=min_duration_s,
                max_duration_s=max_duration_s,
                course_category=course_category,
            )
        docs = await self._personalize_docs(
            docs=docs,
            user_id=user_id,
            content_type=content_type,
            cursor_token=cursor_token,
            profile=profile,
        )
        if docs:
            item_ids = [str(doc.get("_id", "")) for doc in docs]
            await self._apply_engagement_snapshot_to_docs(docs=docs, item_ids=item_ids, user_id=user_id)
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

        total = await self._repository.count_public_items(
            content_type=content_type,
            hashtag=hashtag,
            min_duration_s=min_duration_s,
            max_duration_s=max_duration_s,
            course_category=course_category,
        )
        return FeedPaginatedResponse(
            items=items,
            total=total,
            next_cursor=next_cursor,
            has_more=has_more,
        )

    async def project_feed_items_with_engagement(
        self,
        *,
        docs: list[dict[str, Any]],
        user_id: str | None,
    ) -> list[FeedItemPublic]:
        """Map raw content docs to `FeedItemPublic` with live engagement snapshots."""
        if not docs:
            return []
        item_ids = [str(doc.get("_id", "")) for doc in docs]
        await self._apply_engagement_snapshot_to_docs(
            docs=docs,
            item_ids=item_ids,
            user_id=user_id,
        )
        return [Repository.doc_to_feed_item(doc) for doc in docs]

    async def get_feed_item(self, item_id: str) -> FeedItemPublic:
        """Return a single public feed item."""
        doc = await self._repository.find_public_by_id(item_id)
        if doc is None:
            raise NotFoundError("Feed item not found.", code="feed_item_not_found")
        await self._apply_engagement_snapshot_to_docs(
            docs=[doc],
            item_ids=[item_id],
            user_id=None,
        )
        return Repository.doc_to_feed_item(doc)

    async def _apply_engagement_snapshot_to_docs(
        self,
        *,
        docs: list[dict[str, Any]],
        item_ids: list[str],
        user_id: str | None,
    ) -> None:
        """Attach live counts and current-user flags onto feed docs."""
        if not docs or not item_ids:
            return
        like_counts = await self._repository.list_like_counts(item_ids=item_ids)
        save_counts = await self._repository.list_save_counts(item_ids=item_ids)
        comment_counts = await self._repository.list_comment_counts(item_ids=item_ids)
        share_counts = await self._repository.list_share_counts(item_ids=item_ids)
        liked_ids: set[str] = set()
        saved_ids: set[str] = set()
        if user_id:
            liked_ids = await self._repository.list_user_liked_ids(user_id=user_id, item_ids=item_ids)
            saved_ids = await self._repository.list_user_saved_ids(user_id=user_id, item_ids=item_ids)
        for doc in docs:
            doc_id = str(doc.get("_id", ""))
            doc["like_count"] = int(like_counts.get(doc_id, 0))
            doc["save_count"] = int(save_counts.get(doc_id, 0))
            doc["comment_count"] = int(comment_counts.get(doc_id, 0))
            doc["share_count"] = int(share_counts.get(doc_id, 0))
            doc["liked_by_me"] = doc_id in liked_ids
            doc["saved_by_me"] = doc_id in saved_ids

    async def _personalize_docs(
        self,
        *,
        docs: list[dict[str, Any]],
        user_id: str | None,
        content_type: str | None,
        cursor_token: str | None,
        profile: _SignalProfile | None,
    ) -> list[dict[str, Any]]:
        """Per-user rerank helper for FYP-style variance without changing feed contract."""
        if not docs or not user_id:
            return docs

        if profile is None:
            profile = await self._build_signal_profile(user_id=user_id)
        if not profile.hashtag_weights and not profile.event_boosts:
            return self._stable_user_shuffle(docs=docs, user_id=user_id, cursor_token=cursor_token)

        scoped_type = content_type or "all"
        scored: list[tuple[float, dict[str, Any]]] = []
        total = max(len(docs), 1)
        for idx, doc in enumerate(docs):
            item_id = str(doc.get("_id", ""))
            if item_id in profile.hidden_ids:
                continue
            recency_score = (total - idx) / total
            hashtag_score = 0.0
            for tag in doc.get("hashtags", []):
                hashtag_score += profile.hashtag_weights.get(str(tag).lower(), 0.0)
            event_score = profile.event_boosts.get(item_id, 0.0)
            jitter = _seeded_unit_interval(
                f"{user_id}:{scoped_type}:{cursor_token or 'first'}:{doc.get('_id', '')}",
            )
            score = (
                (0.50 * recency_score)
                + (0.28 * hashtag_score)
                + (0.17 * event_score)
                + (0.05 * jitter)
            )
            scored.append((score, doc))

        if not scored:
            return self._stable_user_shuffle(docs=docs, user_id=user_id, cursor_token=cursor_token)
        scored.sort(
            key=lambda pair: (
                pair[0],
                str(pair[1].get("created_at", "")),
                str(pair[1].get("_id", "")),
            ),
            reverse=True,
        )
        ranked = [doc for _, doc in scored]
        if len(ranked) >= max(3, len(docs) // 2):
            return ranked
        return self._stable_user_shuffle(docs=docs, user_id=user_id, cursor_token=cursor_token)

    async def _build_signal_profile(self, *, user_id: str) -> _SignalProfile:
        engaged_ids = await self._repository.list_recent_user_engaged_item_ids(user_id=user_id)
        hashtag_weights: dict[str, float] = {}
        if engaged_ids:
            hashtag_weights = await self._build_hashtag_weights(engaged_ids=engaged_ids)
        events = await self._repository.list_recent_user_events(user_id=user_id)
        event_boosts, hidden_ids, watched_ids = self._event_boosts_hidden_and_watched(events)
        return _SignalProfile(
            hashtag_weights=hashtag_weights,
            event_boosts=event_boosts,
            hidden_ids=hidden_ids,
            watched_ids=watched_ids,
        )

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

    def _event_boosts_hidden_and_watched(
        self, events: list[dict[str, Any]]
    ) -> tuple[dict[str, float], set[str], set[str]]:
        """Map recent event rows into boosts, hidden exclusions, and watched exclusions."""
        boosts: dict[str, float] = {}
        hidden_ids: set[str] = set()
        watched_ids: set[str] = set()
        for row in events:
            item_id = str(row.get("content_id", ""))
            if not item_id:
                continue
            event = str(row.get("event", ""))
            if event == "hide":
                hidden_ids.add(item_id)
                boosts[item_id] = -1.0
                continue
            if event == "view_complete":
                boosts[item_id] = boosts.get(item_id, 0.0) + 0.35
                watched_ids.add(item_id)
            elif event == "view_start":
                boosts[item_id] = boosts.get(item_id, 0.0) + 0.07
            elif event == "skip":
                boosts[item_id] = boosts.get(item_id, 0.0) - 0.22
            watch_ms = row.get("watch_ms")
            if isinstance(watch_ms, int) and watch_ms > 0:
                boosts[item_id] = boosts.get(item_id, 0.0) + min(watch_ms / 60_000.0, 0.15)
                if watch_ms >= 25_000:
                    watched_ids.add(item_id)
        return boosts, hidden_ids, watched_ids

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
