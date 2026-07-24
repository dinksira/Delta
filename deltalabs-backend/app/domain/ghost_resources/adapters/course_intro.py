"""Fulfill ghosts into course intro metadata slots."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping
from uuid import uuid4

from app.core.exceptions import ValidationError
from app.domain.ghost_resources.adapters.metadata_util import clone_metadata, deep_set
from app.domain.school.repository import Repository as SchoolRepository


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class CourseIntroHostAdapter:
    def __init__(self, school_repo: SchoolRepository) -> None:
        self._school = school_repo

    def can_handle(self, *, host_type: str, slot_key: str, resource_kind: str) -> bool:
        _ = resource_kind
        return host_type == "course" and (
            slot_key.startswith("courseIntro.") or slot_key.startswith("course_intro.")
        )

    async def fulfill(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost: Mapping[str, Any],
        end_node: Mapping[str, Any],
    ) -> dict[str, Any]:
        host_id = str(ghost.get("host_workspace_item_id") or "")
        item = await self._school.find_school_workspace_item(
            org_id=org_id, school_id=school_id, item_id=host_id
        )
        if item is None:
            raise ValidationError("Course host not found.", code="ghost_fulfill_host_missing")

        slot_key = str(ghost.get("slot_key") or "")
        # courseIntro.about.coverImageUrl → path under courseIntro
        prefix = "courseIntro." if slot_key.startswith("courseIntro.") else "course_intro."
        inner = slot_key[len(prefix) :] if slot_key.startswith(prefix) else slot_key

        metadata = clone_metadata(item.get("metadata"))
        intro_key = "courseIntro" if "courseIntro" in metadata or prefix.startswith("courseIntro") else "courseIntro"
        intro = metadata.get(intro_key)
        if not isinstance(intro, dict):
            intro = {}
            metadata[intro_key] = intro

        submission = end_node.get("submission") or {}
        output_refs = list(submission.get("output_refs") or [])
        working = end_node.get("working_head") or {}
        title = str(ghost.get("title") or end_node.get("name") or "Ghost resource")
        description = str(ghost.get("description") or "")

        value: Any
        if inner.startswith("videos"):
            video = {
                "id": f"civ_{uuid4().hex[:12]}",
                "mediaId": str((output_refs[0] or {}).get("mediaId") or working.get("mediaId") or ""),
                "playbackUrl": str(
                    (output_refs[0] or {}).get("playbackUrl") or working.get("playbackUrl") or ""
                ),
                "title": title,
                "label": title,
                "description": description,
                "keyframeTime": "0:00",
                "tags": [],
                "status": "published",
                "publishToFeed": False,
                "createdAt": _utcnow().isoformat(),
                "updatedAt": _utcnow().isoformat(),
            }
            videos = intro.get("videos")
            if not isinstance(videos, list):
                videos = []
            videos = [v for v in videos if not (isinstance(v, dict) and v.get("id") == video["id"])]
            videos.append(video)
            intro["videos"] = videos
            value = video
        elif inner:
            # e.g. about.coverImageUrl / about.welcomeMessage
            leaf = (
                str((output_refs[0] or {}).get("url") or working.get("url") or description or title)
                if "Url" in inner or "url" in inner
                else (description or title)
            )
            deep_set(intro, inner, leaf)
            value = leaf
        else:
            intro["ghostNote"] = description or title
            value = intro["ghostNote"]

        ok = await self._school.update_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=host_id,
            updates={"metadata": metadata},
        )
        if not ok:
            raise ValidationError("Could not write course intro.", code="ghost_fulfill_write_failed")

        return {
            "type": "course_intro",
            "slotKey": slot_key,
            "hostWorkspaceItemId": host_id,
            "value": value,
            "fulfilledAt": _utcnow().isoformat(),
        }
