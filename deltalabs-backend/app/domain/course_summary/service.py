"""Business logic for course Fast Summary."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping

from app.core.exceptions import NotFoundError, ValidationError
from app.domain.course_summary.repository import CourseSummaryRepository, new_summary_id
from app.domain.course_summary.schemas import (
    CourseSummaryAuthorPublic,
    CourseSummaryCreateInput,
    CourseSummaryListResponse,
    CourseSummaryPublic,
    CourseSummaryUpdateInput,
)
from app.domain.ghost_resources.repository import GhostResourcesRepository
from app.domain.school.repository import Repository as SchoolRepository


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class CourseSummaryService:
    def __init__(
        self,
        *,
        summary_repo: CourseSummaryRepository,
        school_repo: SchoolRepository,
        ghost_repo: GhostResourcesRepository | None = None,
    ) -> None:
        self._sm = summary_repo
        self._school = school_repo
        self._ghost = ghost_repo

    async def bootstrap(self) -> None:
        await self._sm.ensure_indexes()

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
        if item is None:
            raise NotFoundError("Course not found.", code="course_workspace_item_not_found")
        if str(item.get("type", "")) != "course":
            raise ValidationError(
                "Workspace item is not a course.",
                code="course_summary_workspace_type_invalid",
            )

    async def _author(self, user_id: str) -> CourseSummaryAuthorPublic:
        doc = await self._school.find_user_profile(user_id=user_id)
        if doc is None:
            return CourseSummaryAuthorPublic(
                user_id=user_id,
                username="Unknown",
                full_name=None,
                avatar_url=None,
            )
        return CourseSummaryAuthorPublic(
            user_id=user_id,
            username=str(doc.get("username") or "user"),
            full_name=(str(doc["full_name"]) if doc.get("full_name") is not None else None),
            avatar_url=(str(doc["avatar_url"]) if doc.get("avatar_url") is not None else None),
        )

    async def _detach_if_ghost_fulfilled(self, doc: dict[str, Any]) -> dict[str, Any]:
        ghost_id = str(doc.get("ghost_id") or "").strip()
        if not ghost_id or self._ghost is None:
            return doc
        ghost = await self._ghost.find_instance(
            org_id=str(doc.get("org_id") or ""),
            school_id=str(doc.get("school_id") or ""),
            ghost_id=ghost_id,
        )
        if ghost is None or str(ghost.get("status") or "") != "fulfilled":
            return doc
        title = str(ghost.get("title") or "").strip() or str(doc.get("title") or "").strip() or "Summary"
        updated = await self._sm.update(
            org_id=str(doc["org_id"]),
            school_id=str(doc["school_id"]),
            course_workspace_item_id=str(doc["course_workspace_item_id"]),
            summary_id=str(doc["_id"]),
            patch={
                "status": "published",
                "title": title,
                "ghost_id": "",
                "ghost_end_variant_id": "",
                "published_at": _utcnow(),
            },
        )
        return updated if isinstance(updated, dict) else doc

    async def _map(self, doc: Mapping[str, Any]) -> CourseSummaryPublic:
        status = str(doc.get("status") or "draft")
        if status not in {"draft", "published", "deleted"}:
            status = "draft"
        layout = str(doc.get("layout") or "split")
        if layout not in {"stack", "split"}:
            layout = "split"
        return CourseSummaryPublic(
            id=str(doc["_id"]),
            org_id=str(doc["org_id"]),
            school_id=str(doc["school_id"]),
            course_workspace_item_id=str(doc["course_workspace_item_id"]),
            title=str(doc.get("title") or ""),
            summary_type=str(doc.get("summary_type") or "academic"),
            section=str(doc.get("section") or ""),
            layout=layout,  # type: ignore[arg-type]
            body_html=str(doc.get("body_html") or ""),
            status=status,  # type: ignore[arg-type]
            org_label=str(doc.get("org_label") or ""),
            read_minutes=(
                int(doc["read_minutes"]) if doc.get("read_minutes") is not None else None
            ),
            ghost_id=(str(doc["ghost_id"]).strip() or None) if doc.get("ghost_id") else None,
            created_by=await self._author(str(doc.get("created_by_user_id") or "")),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    async def list_summaries(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
    ) -> CourseSummaryListResponse:
        await self._require_course(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        docs, total = await self._sm.list(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        items = []
        for d in docs:
            healed = await self._detach_if_ghost_fulfilled(dict(d))
            items.append(await self._map(healed))
        return CourseSummaryListResponse(items=items, total=total)

    async def get_summary(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        summary_id: str,
    ) -> CourseSummaryPublic:
        await self._require_course(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        doc = await self._sm.find(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            summary_id=summary_id,
        )
        if doc is None or str(doc.get("status")) == "deleted":
            raise NotFoundError("Summary not found.", code="course_summary_not_found")
        healed = await self._detach_if_ghost_fulfilled(dict(doc))
        return await self._map(healed)

    async def create_summary(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        user_id: str,
        payload: CourseSummaryCreateInput,
    ) -> CourseSummaryPublic:
        await self._require_course(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        now = _utcnow()
        status = payload.status if payload.status != "deleted" else "draft"
        doc = {
            "_id": new_summary_id(),
            "org_id": org_id,
            "school_id": school_id,
            "course_workspace_item_id": course_workspace_item_id,
            "title": payload.title.strip() or "New Summary",
            "summary_type": payload.summary_type.strip() or "academic",
            "section": payload.section.strip(),
            "layout": payload.layout if payload.layout in {"stack", "split"} else "split",
            "body_html": payload.body_html or "",
            "status": status,
            "org_label": payload.org_label.strip(),
            "read_minutes": payload.read_minutes,
            "created_by_user_id": user_id,
            "created_at": now,
            "updated_at": now,
        }
        await self._sm.insert(doc)
        return await self._map(doc)

    async def update_summary(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        summary_id: str,
        payload: CourseSummaryUpdateInput,
    ) -> CourseSummaryPublic:
        doc = await self._sm.find(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            summary_id=summary_id,
        )
        if doc is None or str(doc.get("status")) == "deleted":
            raise NotFoundError("Summary not found.", code="course_summary_not_found")
        patch: dict[str, Any] = {}
        if payload.title is not None:
            patch["title"] = payload.title.strip()
        if payload.summary_type is not None:
            patch["summary_type"] = payload.summary_type.strip() or "academic"
        if payload.section is not None:
            patch["section"] = payload.section.strip()
        if payload.layout is not None:
            patch["layout"] = payload.layout
        if payload.body_html is not None:
            patch["body_html"] = payload.body_html
        if payload.status is not None and payload.status != "deleted":
            patch["status"] = payload.status
        if payload.org_label is not None:
            patch["org_label"] = payload.org_label.strip()
        if payload.read_minutes is not None:
            patch["read_minutes"] = payload.read_minutes
        if not patch:
            raise ValidationError("No changes provided.", code="course_summary_update_empty")
        updated = await self._sm.update(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            summary_id=summary_id,
            patch=patch,
        )
        assert updated is not None
        return await self._map(updated)

    async def delete_summary(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        summary_id: str,
    ) -> None:
        doc = await self._sm.find(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            summary_id=summary_id,
        )
        if doc is None or str(doc.get("status")) == "deleted":
            raise NotFoundError("Summary not found.", code="course_summary_not_found")
        await self._sm.update(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            summary_id=summary_id,
            patch={"status": "deleted"},
        )
