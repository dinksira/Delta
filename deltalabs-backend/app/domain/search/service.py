"""Ranking and orchestration for global search across public surfaces."""

from __future__ import annotations

from app.domain.content.repository import Repository as ContentRepository
from app.domain.content.schemas import FeedItemPublic
from app.domain.content.service import Service as ContentService
from app.domain.identity.repository import Repository as IdentityRepository
from app.domain.identity.schemas import UserRecord
from app.domain.search.schemas import GlobalSearchResponse, SearchUserHit


def _normalize_q(raw: str) -> str:
    return raw.strip().lower()


def _content_text_score(q_norm: str, doc: dict[str, Any]) -> float:
    """Lexical relevance for captions and hashtags (v0 heuristic)."""
    if not q_norm:
        return 0.0
    score = 0.0
    caption = str(doc.get("caption", "")).lower()
    if q_norm in caption:
        pos = caption.find(q_norm)
        score += 4.0 + 1.0 / (1.0 + float(max(pos, 0)))
    for tag in doc.get("hashtags", []) or []:
        t = str(tag).lower()
        if t == q_norm:
            score += 6.0
        elif q_norm in t:
            score += 2.5
    item_id = str(doc.get("_id", "")).lower()
    if q_norm in item_id:
        score += 1.0
    return score


def _user_score(q_norm: str, user: UserRecord) -> float:
    un = user.username_normalized.lower()
    u = user.username.lower()
    if un == q_norm or u.lower() == q_norm:
        return 10.0
    if un.startswith(q_norm) or u.lower().startswith(q_norm):
        return 7.0
    if q_norm in un or q_norm in u.lower():
        return 4.0
    return 0.0


class SearchService:
    """Compose identity + content matches into one ranked response."""

    def __init__(
        self,
        *,
        content_repository: ContentRepository,
        content_service: ContentService,
        identity_repository: IdentityRepository,
    ) -> None:
        self._content_repo = content_repository
        self._content_service = content_service
        self._identity = identity_repository

    async def bootstrap_indexes(self) -> None:
        await self._content_repo.ensure_indexes()
        await self._identity.ensure_indexes()

    async def _ranked_docs(self, q_raw: str, q_norm: str, content_type: str | None, limit: int) -> list[dict[str, Any]]:
        docs = await self._content_repo.search_public_items_by_text(
            query=q_raw,
            content_type=content_type,
            max_scan=500,
        )
        scored = sorted(
            docs,
            key=lambda d: (
                _content_text_score(q_norm, d),
                str(d.get("created_at", "")),
                str(d.get("_id", "")),
            ),
            reverse=True,
        )
        return scored[:limit]

    async def global_search(
        self,
        *,
        q: str,
        tab: str,
        limit: int,
        user_id: str | None,
    ) -> GlobalSearchResponse:
        """Return ranked buckets for the standalone search UI."""
        q_raw = q.strip()
        q_norm = _normalize_q(q_raw)
        tab_norm = tab.strip().lower() if tab else "top"
        if tab_norm not in {"top", "all", "users", "videos", "audio", "simulation"}:
            tab_norm = "top"

        if not q_norm:
            return GlobalSearchResponse(
                q=q_raw,
                tab=tab_norm,
                users=[],
                videos=[],
                audio=[],
                simulations=[],
            )

        users_out: list[SearchUserHit] = []
        videos_out: list[FeedItemPublic] = []
        audio_out: list[FeedItemPublic] = []
        sim_out: list[FeedItemPublic] = []

        want_users = tab_norm in {"top", "all", "users"}
        want_videos = tab_norm in {"top", "all", "videos"}
        want_audio = tab_norm in {"top", "all", "audio"}
        want_sim = tab_norm in {"top", "all", "simulation"}

        if want_users:
            user_hits = await self._identity.search_active_users_by_text(q_raw, limit=min(limit, 40))
            scored_users = sorted(
                ((_user_score(q_norm, u), u) for u in user_hits),
                key=lambda pair: (pair[0], pair[1].username_normalized),
                reverse=True,
            )
            users_out = [
                SearchUserHit(id=u.id, username=u.username, relevance=float(s))
                for s, u in scored_users
                if s > 0
            ][:limit]

        if want_videos:
            v_docs = await self._ranked_docs(q_raw, q_norm, "video", limit)
            videos_out = await self._content_service.project_feed_items_with_engagement(
                docs=v_docs,
                user_id=user_id,
            )

        if want_audio:
            a_docs = await self._ranked_docs(q_raw, q_norm, "audio", limit)
            audio_out = await self._content_service.project_feed_items_with_engagement(
                docs=a_docs,
                user_id=user_id,
            )

        if want_sim:
            s_docs = await self._ranked_docs(q_raw, q_norm, "simulation", limit)
            sim_out = await self._content_service.project_feed_items_with_engagement(
                docs=s_docs,
                user_id=user_id,
            )

        if tab_norm == "top":
            trim = max(1, min(limit, 24))
            users_out = users_out[:8]
            videos_out = videos_out[:trim]
            audio_out = audio_out[:6]
            sim_out = sim_out[:6]

        return GlobalSearchResponse(
            q=q_raw,
            tab=tab_norm,
            users=users_out,
            videos=videos_out,
            audio=audio_out,
            simulations=sim_out,
        )
