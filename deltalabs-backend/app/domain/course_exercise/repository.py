"""Mongo persistence for course exercises & tests."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, ReturnDocument


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_exercise_id() -> str:
    return f"cex_{uuid4().hex}"


class CourseExerciseRepository:
    def __init__(self, db: AsyncIOMotorDatabase[dict[str, object]]) -> None:
        self._db = db

    async def ensure_indexes(self) -> None:
        col = self._db["school_course_exercises"]
        await col.create_index(
            [
                ("org_id", ASCENDING),
                ("school_id", ASCENDING),
                ("course_workspace_item_id", ASCENDING),
                ("kind", ASCENDING),
                ("created_at", DESCENDING),
            ],
            name="ix_course_exercises_list",
        )

    async def insert(self, doc: dict[str, Any]) -> dict[str, Any]:
        await self._db["school_course_exercises"].insert_one(doc)
        return doc

    async def find(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        exercise_id: str,
    ) -> dict[str, Any] | None:
        return await self._db["school_course_exercises"].find_one(
            {
                "_id": exercise_id,
                "org_id": org_id,
                "school_id": school_id,
                "course_workspace_item_id": course_workspace_item_id,
            }
        )

    async def list(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        kind: str | None,
    ) -> tuple[list[dict[str, Any]], int]:
        filt: dict[str, Any] = {
            "org_id": org_id,
            "school_id": school_id,
            "course_workspace_item_id": course_workspace_item_id,
            "status": {"$ne": "deleted"},
        }
        if kind:
            filt["kind"] = kind
        col = self._db["school_course_exercises"]
        total = await col.count_documents(filt)
        cursor = col.find(filt).sort([("created_at", DESCENDING)])
        return [doc async for doc in cursor], total

    async def update(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        exercise_id: str,
        patch: dict[str, Any],
    ) -> dict[str, Any] | None:
        patch = {**patch, "updated_at": _utcnow()}
        return await self._db["school_course_exercises"].find_one_and_update(
            {
                "_id": exercise_id,
                "org_id": org_id,
                "school_id": school_id,
                "course_workspace_item_id": course_workspace_item_id,
            },
            {"$set": patch},
            return_document=ReturnDocument.AFTER,
        )
