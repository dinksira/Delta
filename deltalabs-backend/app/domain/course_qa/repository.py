"""Mongo persistence for course Q&A questions and answers."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, ReturnDocument


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_question_id() -> str:
    return f"cqq_{uuid4().hex}"


def new_answer_id() -> str:
    return f"cqa_{uuid4().hex}"


def new_comment_id() -> str:
    return f"cqc_{uuid4().hex}"


class CourseQaRepository:
    def __init__(self, db: AsyncIOMotorDatabase[dict[str, object]]) -> None:
        self._db = db

    async def ensure_indexes(self) -> None:
        q = self._db["school_course_qa_questions"]
        a = self._db["school_course_qa_answers"]
        await q.create_index(
            [
                ("org_id", ASCENDING),
                ("school_id", ASCENDING),
                ("course_workspace_item_id", ASCENDING),
                ("status", ASCENDING),
                ("created_at", DESCENDING),
            ],
            name="ix_course_qa_questions_list",
        )
        await q.create_index(
            [("org_id", ASCENDING), ("school_id", ASCENDING), ("_id", ASCENDING)],
            name="ix_course_qa_questions_id",
        )
        await a.create_index(
            [
                ("org_id", ASCENDING),
                ("school_id", ASCENDING),
                ("question_id", ASCENDING),
                ("created_at", ASCENDING),
            ],
            name="ix_course_qa_answers_question",
        )

    async def insert_question(self, doc: dict[str, Any]) -> dict[str, Any]:
        await self._db["school_course_qa_questions"].insert_one(doc)
        return doc

    async def find_question(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        question_id: str,
    ) -> dict[str, Any] | None:
        return await self._db["school_course_qa_questions"].find_one(
            {
                "_id": question_id,
                "org_id": org_id,
                "school_id": school_id,
                "course_workspace_item_id": course_workspace_item_id,
            }
        )

    async def list_questions(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        q: str | None,
        tag: str | None,
        include_trash: bool,
        viewer_user_id: str,
        can_manage: bool,
        limit: int = 50,
        skip: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        filt: dict[str, Any] = {
            "org_id": org_id,
            "school_id": school_id,
            "course_workspace_item_id": course_workspace_item_id,
        }
        if not (include_trash and can_manage):
            filt["status"] = {"$ne": "trash"}

        visibility_or: list[dict[str, Any]] = [{"visibility": "public"}]
        if can_manage:
            visibility_or.append({"visibility": "private"})
        else:
            visibility_or.append({"visibility": "private", "author_user_id": viewer_user_id})

        and_parts: list[dict[str, Any]] = [{"$or": visibility_or}]

        if tag and tag.strip():
            and_parts.append(
                {"tags": {"$elemMatch": {"$regex": f"^{tag.strip()}$", "$options": "i"}}}
            )

        if q and q.strip():
            term = q.strip()
            and_parts.append(
                {
                    "$or": [
                        {"title": {"$regex": term, "$options": "i"}},
                        {"body": {"$regex": term, "$options": "i"}},
                        {"tags": {"$elemMatch": {"$regex": term, "$options": "i"}}},
                    ]
                }
            )

        filt["$and"] = and_parts

        col = self._db["school_course_qa_questions"]
        total = await col.count_documents(filt)
        cursor = col.find(filt).sort([("created_at", DESCENDING)]).skip(skip).limit(limit)
        return [doc async for doc in cursor], total

    async def update_question(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        question_id: str,
        patch: dict[str, Any],
    ) -> dict[str, Any] | None:
        patch = {**patch, "updated_at": _utcnow()}
        return await self._db["school_course_qa_questions"].find_one_and_update(
            {
                "_id": question_id,
                "org_id": org_id,
                "school_id": school_id,
                "course_workspace_item_id": course_workspace_item_id,
            },
            {"$set": patch},
            return_document=ReturnDocument.AFTER,
        )

    async def increment_view_count(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        question_id: str,
    ) -> None:
        await self._db["school_course_qa_questions"].update_one(
            {
                "_id": question_id,
                "org_id": org_id,
                "school_id": school_id,
                "course_workspace_item_id": course_workspace_item_id,
            },
            {"$inc": {"view_count": 1}, "$set": {"updated_at": _utcnow()}},
        )

    async def set_question_vote(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        question_id: str,
        user_id: str,
        value: int | None,
    ) -> dict[str, Any] | None:
        doc = await self.find_question(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            question_id=question_id,
        )
        if doc is None:
            return None
        votes: dict[str, int] = dict(doc.get("votes") or {})
        if value is None:
            votes.pop(user_id, None)
        else:
            votes[user_id] = value
        score = sum(int(v) for v in votes.values())
        return await self.update_question(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            question_id=question_id,
            patch={"votes": votes, "vote_score": score},
        )

    async def toggle_bookmark(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        question_id: str,
        user_id: str,
    ) -> dict[str, Any] | None:
        doc = await self.find_question(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            question_id=question_id,
        )
        if doc is None:
            return None
        bookmarked: list[str] = [str(x) for x in (doc.get("bookmarked_by") or [])]
        if user_id in bookmarked:
            bookmarked = [x for x in bookmarked if x != user_id]
        else:
            bookmarked.append(user_id)
        return await self.update_question(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            question_id=question_id,
            patch={"bookmarked_by": bookmarked},
        )

    async def insert_answer(self, doc: dict[str, Any]) -> dict[str, Any]:
        await self._db["school_course_qa_answers"].insert_one(doc)
        await self._db["school_course_qa_questions"].update_one(
            {"_id": doc["question_id"]},
            {"$inc": {"answer_count": 1}, "$set": {"updated_at": _utcnow()}},
        )
        return doc

    async def find_answer(
        self,
        *,
        org_id: str,
        school_id: str,
        answer_id: str,
    ) -> dict[str, Any] | None:
        return await self._db["school_course_qa_answers"].find_one(
            {"_id": answer_id, "org_id": org_id, "school_id": school_id}
        )

    async def list_answers(
        self,
        *,
        org_id: str,
        school_id: str,
        question_id: str,
    ) -> list[dict[str, Any]]:
        cursor = (
            self._db["school_course_qa_answers"]
            .find({"org_id": org_id, "school_id": school_id, "question_id": question_id})
            .sort([("is_accepted", DESCENDING), ("vote_score", DESCENDING), ("created_at", ASCENDING)])
        )
        return [doc async for doc in cursor]

    async def update_answer(
        self,
        *,
        org_id: str,
        school_id: str,
        answer_id: str,
        patch: dict[str, Any],
    ) -> dict[str, Any] | None:
        patch = {**patch, "updated_at": _utcnow()}
        return await self._db["school_course_qa_answers"].find_one_and_update(
            {"_id": answer_id, "org_id": org_id, "school_id": school_id},
            {"$set": patch},
            return_document=ReturnDocument.AFTER,
        )

    async def set_answer_vote(
        self,
        *,
        org_id: str,
        school_id: str,
        answer_id: str,
        user_id: str,
        value: int | None,
    ) -> dict[str, Any] | None:
        doc = await self.find_answer(org_id=org_id, school_id=school_id, answer_id=answer_id)
        if doc is None:
            return None
        votes: dict[str, int] = dict(doc.get("votes") or {})
        if value is None:
            votes.pop(user_id, None)
        else:
            votes[user_id] = value
        score = sum(int(v) for v in votes.values())
        return await self.update_answer(
            org_id=org_id,
            school_id=school_id,
            answer_id=answer_id,
            patch={"votes": votes, "vote_score": score},
        )

    async def accept_answer(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        question_id: str,
        answer_id: str,
    ) -> None:
        await self._db["school_course_qa_answers"].update_many(
            {"org_id": org_id, "school_id": school_id, "question_id": question_id},
            {"$set": {"is_accepted": False, "updated_at": _utcnow()}},
        )
        await self._db["school_course_qa_answers"].update_one(
            {"_id": answer_id, "org_id": org_id, "school_id": school_id, "question_id": question_id},
            {"$set": {"is_accepted": True, "updated_at": _utcnow()}},
        )
        await self.update_question(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            question_id=question_id,
            patch={"accepted_answer_id": answer_id},
        )

    async def append_answer_comment(
        self,
        *,
        org_id: str,
        school_id: str,
        answer_id: str,
        comment: dict[str, Any],
    ) -> dict[str, Any] | None:
        return await self._db["school_course_qa_answers"].find_one_and_update(
            {"_id": answer_id, "org_id": org_id, "school_id": school_id},
            {
                "$push": {"comments": comment},
                "$set": {"updated_at": _utcnow()},
            },
            return_document=ReturnDocument.AFTER,
        )
