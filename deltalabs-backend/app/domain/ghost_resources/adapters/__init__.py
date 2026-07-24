"""Registry of ghost HostAdapters."""

from __future__ import annotations

from typing import Any

from app.core.exceptions import ValidationError
from app.domain.ghost_resources.adapters.course_intro import CourseIntroHostAdapter
from app.domain.ghost_resources.adapters.workspace_library import WorkspaceLibraryHostAdapter
from app.domain.school.repository import Repository as SchoolRepository


class HostAdapterRegistry:
    def __init__(self, school_repo: SchoolRepository) -> None:
        self._adapters: list[Any] = [
            CourseIntroHostAdapter(school_repo),
            WorkspaceLibraryHostAdapter(school_repo),
        ]

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
