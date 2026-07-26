"""Fulfill fast_summary ghosts → publish CourseSummary L3 on the course host."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping

from app.core.exceptions import ValidationError
from app.domain.course_summary.repository import CourseSummaryRepository
from app.domain.school.repository import Repository as SchoolRepository


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class CourseFastSummaryHostAdapter:
    """Publishes the linked summary draft and clears the ghost link."""

    def __init__(
        self,
        school_repo: SchoolRepository,
        summary_repo: CourseSummaryRepository,
    ) -> None:
        self._school = school_repo
        self._sm = summary_repo

    def can_handle(self, *, host_type: str, slot_key: str, resource_kind: str) -> bool:
        _ = slot_key
        return host_type == "course" and resource_kind == "fast_summary"

    async def fulfill(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost: Mapping[str, Any],
        end_node: Mapping[str, Any],
    ) -> dict[str, Any]:
        host_id = str(ghost.get("host_workspace_item_id") or "").strip()
        if not host_id:
            raise ValidationError("Course host missing.", code="ghost_fulfill_host_missing")

        item = await self._school.find_school_workspace_item(
            org_id=org_id, school_id=school_id, item_id=host_id
        )
        if item is None:
            raise ValidationError("Course host not found.", code="ghost_fulfill_host_missing")

        working = end_node.get("working_head") if isinstance(end_node.get("working_head"), dict) else {}
        summary_id = str(
            working.get("summaryDraftId") or working.get("summary_draft_id") or ""
        ).strip()
        if not summary_id:
            raise ValidationError(
                "No summary draft linked. Open work on the end node before fulfilling.",
                code="ghost_fulfill_summary_draft_missing",
            )

        existing = await self._sm.find(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=host_id,
            summary_id=summary_id,
        )
        if existing is None:
            raise ValidationError(
                "Linked summary draft was not found.",
                code="ghost_fulfill_summary_missing",
            )

        ghost_title = str(ghost.get("title") or "").strip()
        title = ghost_title or str(existing.get("title") or "").strip() or "Summary"
        now = _utcnow()
        updated = await self._sm.update(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=host_id,
            summary_id=summary_id,
            patch={
                "status": "published",
                "title": title,
                "ghost_id": "",
                "ghost_end_variant_id": "",
                "published_at": now,
            },
        )
        if updated is None:
            raise ValidationError(
                "Could not publish summary.",
                code="ghost_fulfill_summary_write_failed",
            )

        return {
            "type": "course_summary",
            "slotKey": str(ghost.get("slot_key") or ""),
            "hostWorkspaceItemId": host_id,
            "summaryId": summary_id,
            "resourceKind": "fast_summary",
            "title": title,
            "fulfilledAt": now.isoformat(),
        }
