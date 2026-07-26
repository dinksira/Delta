"""Mongo persistence for course Score boards (one doc per course)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, ReturnDocument


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_scoreboard_id() -> str:
    return f"csb_{uuid4().hex}"


def new_assessment_id() -> str:
    return f"csa_{uuid4().hex}"


def new_entry_id() -> str:
    return f"cse_{uuid4().hex}"


class CourseScoreRepository:
    def __init__(self, db: AsyncIOMotorDatabase[dict[str, object]]) -> None:
        self._db = db

    async def ensure_indexes(self) -> None:
        col = self._db["school_course_scoreboards"]
        await col.create_index(
            [
                ("org_id", ASCENDING),
                ("school_id", ASCENDING),
                ("course_workspace_item_id", ASCENDING),
            ],
            name="ux_course_scoreboard",
            unique=True,
        )

    async def find(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
    ) -> dict[str, Any] | None:
        return await self._db["school_course_scoreboards"].find_one(
            {
                "org_id": org_id,
                "school_id": school_id,
                "course_workspace_item_id": course_workspace_item_id,
            }
        )

    async def insert(self, doc: dict[str, Any]) -> dict[str, Any]:
        await self._db["school_course_scoreboards"].insert_one(doc)
        return doc

    async def replace(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        patch: dict[str, Any],
    ) -> dict[str, Any] | None:
        patch = {**patch, "updated_at": _utcnow()}
        return await self._db["school_course_scoreboards"].find_one_and_update(
            {
                "org_id": org_id,
                "school_id": school_id,
                "course_workspace_item_id": course_workspace_item_id,
            },
            {"$set": patch},
            return_document=ReturnDocument.AFTER,
        )
