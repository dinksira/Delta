"""Registry of ghost HostAdapters."""

from __future__ import annotations

from typing import Any

from app.core.exceptions import ValidationError
from app.domain.course_exercise.repository import CourseExerciseRepository
from app.domain.ghost_resources.adapters.course_exercise import CourseExerciseHostAdapter
from app.domain.ghost_resources.adapters.course_intro import CourseIntroHostAdapter
from app.domain.ghost_resources.adapters.workspace_library import WorkspaceLibraryHostAdapter
from app.domain.school.repository import Repository as SchoolRepository


class HostAdapterRegistry:
    def __init__(
        self,
        school_repo: SchoolRepository,
        exercise_repo: CourseExerciseRepository | None = None,
    ) -> None:
        adapters: list[Any] = [
            CourseIntroHostAdapter(school_repo),
        ]
        if exercise_repo is not None:
            # Before WorkspaceLibrary so exercise/test do not fall through to metadata-only fulfill.
            adapters.append(CourseExerciseHostAdapter(school_repo, exercise_repo))
        adapters.append(WorkspaceLibraryHostAdapter(school_repo))
        self._adapters = adapters

    def resolve(self, *, host_type: str, slot_key: str, resource_kind: str) -> Any:
        for adapter in self._adapters:
            if adapter.can_handle(
                host_type=host_type, slot_key=slot_key, resource_kind=resource_kind
            ):
                return adapter
        raise ValidationError(
            "No host adapter for this ghost slot.",
            code="ghost_fulfill_adapter_missing",
        )
