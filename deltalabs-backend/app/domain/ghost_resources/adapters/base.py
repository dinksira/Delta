"""Host adapter protocol for Ghost fulfill → L3."""

from __future__ import annotations

from typing import Any, Mapping, Protocol


class HostAdapter(Protocol):
    def can_handle(self, *, host_type: str, slot_key: str, resource_kind: str) -> bool: ...

    async def fulfill(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost: Mapping[str, Any],
        end_node: Mapping[str, Any],
    ) -> dict[str, Any]:
        """Apply L3 write; return promoted_resource payload."""
        ...
