"""Business logic for course Exercise & Test."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping

from app.core.exceptions import NotFoundError, ValidationError
from app.domain.course_exercise.repository import CourseExerciseRepository, new_exercise_id
from app.domain.course_exercise.schemas import (
    CourseExerciseAuthorPublic,
    CourseExerciseCreateInput,
    CourseExerciseListResponse,
    CourseExercisePublic,
    CourseExerciseUpdateInput,
)
from app.domain.school.repository import Repository as SchoolRepository


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class CourseExerciseService:
    def __init__(
        self,
        *,
        exercise_repo: CourseExerciseRepository,
        school_repo: SchoolRepository,
    ) -> None:
        self._ex = exercise_repo
        self._school = school_repo

    async def bootstrap(self) -> None:
        await self._ex.ensure_indexes()

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
                code="course_exercise_workspace_type_invalid",
            )

    async def _author(self, user_id: str) -> CourseExerciseAuthorPublic:
        doc = await self._school.find_user_profile(user_id=user_id)
        if doc is None:
            return CourseExerciseAuthorPublic(
                user_id=user_id,
                username="Unknown",
                full_name=None,
                avatar_url=None,
            )
        return CourseExerciseAuthorPublic(
            user_id=user_id,
            username=str(doc.get("username") or "user"),
            full_name=(str(doc["full_name"]) if doc.get("full_name") is not None else None),
            avatar_url=(str(doc["avatar_url"]) if doc.get("avatar_url") is not None else None),
        )

    async def _map(self, doc: Mapping[str, Any]) -> CourseExercisePublic:
        return CourseExercisePublic(
            id=str(doc["_id"]),
            org_id=str(doc["org_id"]),
            school_id=str(doc["school_id"]),
            course_workspace_item_id=str(doc["course_workspace_item_id"]),
            kind=str(doc.get("kind") or "exercise"),  # type: ignore[arg-type]
            title=str(doc.get("title") or ""),
            time_taken=str(doc.get("time_taken") or ""),
            total_questions=int(doc.get("total_questions") or 0),
            cover_image_url=str(doc.get("cover_image_url") or ""),
            org_label=str(doc.get("org_label") or ""),
            created_by=await self._author(str(doc.get("created_by_user_id") or "")),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    async def list_exercises(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        kind: str | None = None,
    ) -> CourseExerciseListResponse:
        await self._require_course(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        docs, total = await self._ex.list(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            kind=kind,
        )
        items = [await self._map(d) for d in docs]
        return CourseExerciseListResponse(items=items, total=total)

    async def create_exercise(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        user_id: str,
        payload: CourseExerciseCreateInput,
    ) -> CourseExercisePublic:
        await self._require_course(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        now = _utcnow()
        doc = {
            "_id": new_exercise_id(),
            "org_id": org_id,
            "school_id": school_id,
            "course_workspace_item_id": course_workspace_item_id,
            "kind": payload.kind,
            "title": payload.title.strip(),
            "time_taken": payload.time_taken.strip(),
            "total_questions": int(payload.total_questions),
            "cover_image_url": payload.cover_image_url.strip(),
            "org_label": payload.org_label.strip(),
            "created_by_user_id": user_id,
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }
        await self._ex.insert(doc)
        return await self._map(doc)

    async def update_exercise(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        exercise_id: str,
        payload: CourseExerciseUpdateInput,
    ) -> CourseExercisePublic:
        doc = await self._ex.find(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            exercise_id=exercise_id,
        )
        if doc is None or str(doc.get("status")) == "deleted":
            raise NotFoundError("Exercise not found.", code="course_exercise_not_found")
        patch: dict[str, Any] = {}
        if payload.title is not None:
            patch["title"] = payload.title.strip()
        if payload.time_taken is not None:
            patch["time_taken"] = payload.time_taken.strip()
        if payload.total_questions is not None:
            patch["total_questions"] = int(payload.total_questions)
        if payload.cover_image_url is not None:
            patch["cover_image_url"] = payload.cover_image_url.strip()
        if payload.org_label is not None:
            patch["org_label"] = payload.org_label.strip()
        if not patch:
            raise ValidationError("No changes provided.", code="course_exercise_update_empty")
        updated = await self._ex.update(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            exercise_id=exercise_id,
            patch=patch,
        )
        assert updated is not None
        return await self._map(updated)

    async def delete_exercise(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        exercise_id: str,
    ) -> None:
        updated = await self._ex.update(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            exercise_id=exercise_id,
            patch={"status": "deleted"},
        )
        if updated is None:
            raise NotFoundError("Exercise not found.", code="course_exercise_not_found")
