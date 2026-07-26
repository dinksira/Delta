"""Business logic for course Supplements."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.core.exceptions import NotFoundError, ValidationError
from app.domain.course_supplement.repository import CourseSupplementRepository, new_supplement_id
from app.domain.course_supplement.schemas import (
    CourseSupplementAuthorPublic,
    CourseSupplementCreateInput,
    CourseSupplementKind,
    CourseSupplementListResponse,
    CourseSupplementPublic,
    CourseSupplementUpdateInput,
)
from app.domain.school.repository import Repository as SchoolRepository


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def infer_supplement_kind(*, content_type: str, file_name: str, link_url: str = "") -> CourseSupplementKind:
    blob = f"{content_type} {file_name} {link_url}".lower()
    if "pdf" in blob or blob.endswith(".pdf"):
        return "pdf"
    if any(x in blob for x in ("powerpoint", "presentation", ".ppt", ".pptx", ".key", ".odp")):
        return "slides"
    if content_type.startswith("video/") or any(
        x in blob for x in (".mp4", ".webm", ".mov", ".m4v", ".mkv")
    ):
        return "video"
    if content_type.startswith("audio/") or any(
        x in blob for x in (".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac")
    ):
        return "audio"
    return "other"


class CourseSupplementService:
    def __init__(
        self,
        *,
        supplement_repo: CourseSupplementRepository,
        school_repo: SchoolRepository,
    ) -> None:
        self._sp = supplement_repo
        self._school = school_repo

    async def bootstrap(self) -> None:
        await self._sp.ensure_indexes()

    async def _require_course(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
    ) -> None:
        school = await self._school.find_school(org_id=org_id, school_id=school_id)
        if school is None:
            raise NotFoundError("School not found.", code="school_not_found")
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=course_workspace_item_id,
        )
        if item is None or str(item.get("type") or "") != "course":
            raise NotFoundError("Course not found.", code="course_not_found")

    async def _author(self, user_id: str) -> CourseSupplementAuthorPublic:
        doc = await self._school.find_user_profile(user_id=user_id)
        if doc is None:
            return CourseSupplementAuthorPublic(
                user_id=user_id,
                username="Unknown",
                full_name=None,
                avatar_url=None,
            )
        return CourseSupplementAuthorPublic(
            user_id=user_id,
            username=str(doc.get("username") or "user"),
            full_name=(str(doc["full_name"]) if doc.get("full_name") is not None else None),
            avatar_url=(str(doc["avatar_url"]) if doc.get("avatar_url") is not None else None),
        )

    def _map(self, doc: dict[str, Any], author: CourseSupplementAuthorPublic) -> CourseSupplementPublic:
        ghost_raw = doc.get("ghost_id")
        ghost_id = str(ghost_raw).strip() if isinstance(ghost_raw, str) and ghost_raw.strip() else None
        return CourseSupplementPublic(
            id=str(doc.get("_id") or ""),
            org_id=str(doc.get("org_id") or ""),
            school_id=str(doc.get("school_id") or ""),
            course_workspace_item_id=str(doc.get("course_workspace_item_id") or ""),
            title=str(doc.get("title") or ""),
            description=str(doc.get("description") or ""),
            kind=doc.get("kind") or "other",  # type: ignore[arg-type]
            source=doc.get("source") or "upload",  # type: ignore[arg-type]
            tags=[str(t) for t in (doc.get("tags") or []) if str(t).strip()],
            media_id=doc.get("media_id"),
            playback_url=str(doc.get("playback_url") or ""),
            link_url=str(doc.get("link_url") or ""),
            content_type=str(doc.get("content_type") or ""),
            file_name=str(doc.get("file_name") or ""),
            status=doc.get("status") or "published",  # type: ignore[arg-type]
            ghost_id=ghost_id,
            created_by=author,
            created_at=doc.get("created_at") or _utcnow(),
            updated_at=doc.get("updated_at") or _utcnow(),
        )

    async def list_supplements(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        kind: str | None = None,
        ghosts_only: bool = False,
    ) -> CourseSupplementListResponse:
        await self._require_course(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        docs, total = await self._sp.list(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            kind=kind,
            ghosts_only=ghosts_only,
        )
        items: list[CourseSupplementPublic] = []
        for doc in docs:
            author = await self._author(str(doc.get("created_by_user_id") or ""))
            items.append(self._map(doc, author))
        return CourseSupplementListResponse(items=items, total=total)

    async def get_supplement(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        supplement_id: str,
    ) -> CourseSupplementPublic:
        await self._require_course(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        doc = await self._sp.find(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            supplement_id=supplement_id,
        )
        if doc is None or str(doc.get("status") or "") == "deleted":
            raise NotFoundError("Supplement not found.", code="supplement_not_found")
        author = await self._author(str(doc.get("created_by_user_id") or ""))
        return self._map(doc, author)

    async def create_supplement(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        user_id: str,
        payload: CourseSupplementCreateInput,
    ) -> CourseSupplementPublic:
        await self._require_course(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        title = payload.title.strip()
        if not title:
            raise ValidationError("Title is required.", code="supplement_title_required")
        source = payload.source
        media_id = (payload.media_id or "").strip() or None
        link_url = (payload.link_url or "").strip()
        playback_url = (payload.playback_url or "").strip()
        if source == "upload" and not media_id and not playback_url:
            raise ValidationError("Upload a file or provide playback URL.", code="supplement_file_required")
        if source == "link" and not link_url:
            raise ValidationError("Link URL is required.", code="supplement_link_required")

        kind = payload.kind or infer_supplement_kind(
            content_type=payload.content_type,
            file_name=payload.file_name,
            link_url=link_url or playback_url,
        )
        tags = [t.strip() for t in payload.tags if t.strip()][:24]
        now = _utcnow()
        doc = {
            "_id": new_supplement_id(),
            "org_id": org_id,
            "school_id": school_id,
            "course_workspace_item_id": course_workspace_item_id,
            "title": title,
            "description": (payload.description or "").strip(),
            "kind": kind,
            "source": source,
            "tags": tags,
            "media_id": media_id,
            "playback_url": playback_url or link_url,
            "link_url": link_url,
            "content_type": (payload.content_type or "").strip(),
            "file_name": (payload.file_name or "").strip(),
            "status": payload.status if payload.status in {"draft", "published"} else "published",
            "ghost_id": None,
            "created_by_user_id": user_id,
            "created_at": now,
            "updated_at": now,
        }
        await self._sp.insert(doc)
        author = await self._author(user_id)
        return self._map(doc, author)

    async def update_supplement(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        supplement_id: str,
        payload: CourseSupplementUpdateInput,
    ) -> CourseSupplementPublic:
        existing = await self._sp.find(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            supplement_id=supplement_id,
        )
        if existing is None or str(existing.get("status") or "") == "deleted":
            raise NotFoundError("Supplement not found.", code="supplement_not_found")
        patch: dict[str, Any] = {}
        if payload.title is not None:
            patch["title"] = payload.title.strip()
        if payload.description is not None:
            patch["description"] = payload.description.strip()
        if payload.kind is not None:
            patch["kind"] = payload.kind
        if payload.tags is not None:
            patch["tags"] = [t.strip() for t in payload.tags if t.strip()][:24]
        if payload.media_id is not None:
            patch["media_id"] = payload.media_id.strip() or None
        if payload.playback_url is not None:
            patch["playback_url"] = payload.playback_url.strip()
        if payload.link_url is not None:
            patch["link_url"] = payload.link_url.strip()
        if payload.content_type is not None:
            patch["content_type"] = payload.content_type.strip()
        if payload.file_name is not None:
            patch["file_name"] = payload.file_name.strip()
        if payload.status is not None:
            patch["status"] = payload.status
        doc = await self._sp.update(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            supplement_id=supplement_id,
            patch=patch,
        )
        if doc is None:
            raise NotFoundError("Supplement not found.", code="supplement_not_found")
        author = await self._author(str(doc.get("created_by_user_id") or ""))
        return self._map(doc, author)

    async def delete_supplement(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        supplement_id: str,
    ) -> None:
        doc = await self._sp.update(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            supplement_id=supplement_id,
            patch={"status": "deleted"},
        )
        if doc is None:
            raise NotFoundError("Supplement not found.", code="supplement_not_found")
