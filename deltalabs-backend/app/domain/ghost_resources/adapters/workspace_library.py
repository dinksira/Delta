"""Fulfill ghosts onto course / class workspace metadata (generic library slots)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping
from uuid import uuid4

from app.core.exceptions import ValidationError
from app.domain.ghost_resources.adapters.metadata_util import clone_metadata
from app.domain.school.repository import Repository as SchoolRepository


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class WorkspaceLibraryHostAdapter:
    """Default adapter for course exercise slots, class library, department, school."""

    def __init__(self, school_repo: SchoolRepository) -> None:
        self._school = school_repo

    def can_handle(self, *, host_type: str, slot_key: str, resource_kind: str) -> bool:
        _ = resource_kind
        if host_type == "course" and (
            slot_key.startswith("courseIntro.") or slot_key.startswith("course_intro.")
        ):
            return False
        return host_type in {"course", "class", "department", "school"}

    async def fulfill(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost: Mapping[str, Any],
        end_node: Mapping[str, Any],
    ) -> dict[str, Any]:
        host_type = str(ghost.get("host_type") or "course")
        host_id = str(ghost.get("host_workspace_item_id") or "")
        if host_type == "school":
            # School-level: store on school document metadata if present; else ghost-only promote
            return {
                "type": "school_asset",
                "slotKey": str(ghost.get("slot_key") or ""),
                "ghostId": str(ghost.get("_id") or ""),
                "title": str(ghost.get("title") or end_node.get("name") or ""),
                "description": str(ghost.get("description") or ""),
                "fulfilledAt": _utcnow().isoformat(),
            }

        item = await self._school.find_school_workspace_item(
            org_id=org_id, school_id=school_id, item_id=host_id
        )
        if item is None:
            raise ValidationError("Host workspace item not found.", code="ghost_fulfill_host_missing")

        metadata = clone_metadata(item.get("metadata"))
        bucket = metadata.get("ghostFulfilled")
        if not isinstance(bucket, list):
            bucket = []

        entry = {
            "id": f"gfp_{uuid4().hex[:12]}",
            "ghostId": str(ghost.get("_id") or ""),
            "slotKey": str(ghost.get("slot_key") or ""),
            "resourceKind": str(ghost.get("resource_kind") or "document"),
            "title": str(ghost.get("title") or end_node.get("name") or "Ghost resource"),
            "description": str(ghost.get("description") or ""),
            "endVariantId": str(end_node.get("_id") or ""),
            "endVariantName": str(end_node.get("name") or ""),
            "availableInputs": list(end_node.get("available_inputs") or []),
            "fulfilledAt": _utcnow().isoformat(),
        }
        bucket = [x for x in bucket if not (isinstance(x, dict) and x.get("ghostId") == entry["ghostId"])]
        bucket.append(entry)
        metadata["ghostFulfilled"] = bucket

        ok = await self._school.update_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=host_id,
            updates={"metadata": metadata},
        )
        if not ok:
            raise ValidationError("Could not write host metadata.", code="ghost_fulfill_write_failed")

        return {
            "type": f"{host_type}_library",
            "slotKey": entry["slotKey"],
            "hostWorkspaceItemId": host_id,
            "entryId": entry["id"],
            "fulfilledAt": entry["fulfilledAt"],
        }
