"""Fulfill exercise/test ghosts → publish CourseExercise L3 on the course host."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping

from app.core.exceptions import ValidationError
from app.domain.course_exercise.repository import CourseExerciseRepository
from app.domain.school.repository import Repository as SchoolRepository


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class CourseExerciseHostAdapter:
    """Publishes the linked exercise draft and clears the ghost link so Direct View shows a real card."""

    def __init__(
        self,
        school_repo: SchoolRepository,
        exercise_repo: CourseExerciseRepository,
    ) -> None:
        self._school = school_repo
        self._ex = exercise_repo

    def can_handle(self, *, host_type: str, slot_key: str, resource_kind: str) -> bool:
        _ = slot_key
        return host_type == "course" and resource_kind in {"exercise", "test"}

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
        exercise_id = str(
            working.get("exerciseDraftId") or working.get("exercise_draft_id") or ""
        ).strip()
        if not exercise_id:
            raise ValidationError(
                "No exercise draft linked. Open work on the end node before fulfilling.",
                code="ghost_fulfill_exercise_draft_missing",
            )

        existing = await self._ex.find(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=host_id,
            exercise_id=exercise_id,
        )
        if existing is None:
            raise ValidationError(
                "Linked exercise draft was not found.",
                code="ghost_fulfill_exercise_missing",
            )

        ghost_title = str(ghost.get("title") or "").strip()
        title = ghost_title or str(existing.get("title") or "").strip() or "Exercise"
        now = _utcnow()
        updated = await self._ex.update(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=host_id,
            exercise_id=exercise_id,
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
                "Could not publish exercise.",
                code="ghost_fulfill_exercise_write_failed",
            )

        return {
            "type": "course_exercise",
            "slotKey": str(ghost.get("slot_key") or ""),
            "hostWorkspaceItemId": host_id,
            "exerciseId": exercise_id,
            "resourceKind": str(ghost.get("resource_kind") or "exercise"),
            "title": title,
            "fulfilledAt": now.isoformat(),
        }
