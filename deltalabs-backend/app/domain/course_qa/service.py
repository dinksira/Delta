"""Business logic for course-scoped Q&A."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping

from app.core.exceptions import NotFoundError, PermissionDeniedError, ValidationError
from app.domain.course_qa.repository import (
    CourseQaRepository,
    new_answer_id,
    new_comment_id,
    new_question_id,
)
from app.domain.course_qa.schemas import (
    CourseQaAnswerCreateInput,
    CourseQaAnswerPublic,
    CourseQaAnswerUpdateInput,
    CourseQaAuthorPublic,
    CourseQaCommentCreateInput,
    CourseQaCommentPublic,
    CourseQaQuestionCreateInput,
    CourseQaQuestionDetailPublic,
    CourseQaQuestionListResponse,
    CourseQaQuestionPublic,
    CourseQaQuestionUpdateInput,
    CourseQaVoteInput,
)
from app.domain.school.repository import Repository as SchoolRepository


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class CourseQaService:
    def __init__(
        self,
        *,
        qa_repo: CourseQaRepository,
        school_repo: SchoolRepository,
    ) -> None:
        self._qa = qa_repo
        self._school = school_repo

    async def bootstrap(self) -> None:
        await self._qa.ensure_indexes()

    async def _require_school(self, *, org_id: str, school_id: str) -> None:
        school = await self._school.find_school(org_id=org_id, school_id=school_id)
        if school is None:
            raise NotFoundError("School not found.", code="school_not_found")

    async def _require_course(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
    ) -> Mapping[str, Any]:
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
                code="course_qa_workspace_type_invalid",
            )
        return item

    async def _author_public(self, user_id: str, *, anonymous: bool = False) -> CourseQaAuthorPublic:
        if anonymous:
            return CourseQaAuthorPublic(
                user_id="anonymous",
                username="Anonymous",
                full_name=None,
                avatar_url=None,
            )
        doc = await self._school.find_user_profile(user_id=user_id)
        if doc is None:
            return CourseQaAuthorPublic(
                user_id=user_id,
                username="Unknown",
                full_name=None,
                avatar_url=None,
            )
        return CourseQaAuthorPublic(
            user_id=user_id,
            username=str(doc.get("username") or "user"),
            full_name=(str(doc["full_name"]) if doc.get("full_name") is not None else None),
            avatar_url=(str(doc["avatar_url"]) if doc.get("avatar_url") is not None else None),
        )

    def _my_vote(self, votes: Mapping[str, Any] | None, user_id: str) -> int:
        if not votes:
            return 0
        raw = votes.get(user_id)
        try:
            return int(raw) if raw is not None else 0
        except (TypeError, ValueError):
            return 0

    async def _map_question(
        self,
        doc: Mapping[str, Any],
        *,
        viewer_user_id: str,
    ) -> CourseQaQuestionPublic:
        author_id = str(doc.get("author_user_id") or "")
        bookmarked = [str(x) for x in (doc.get("bookmarked_by") or [])]
        return CourseQaQuestionPublic(
            id=str(doc["_id"]),
            org_id=str(doc["org_id"]),
            school_id=str(doc["school_id"]),
            course_workspace_item_id=str(doc["course_workspace_item_id"]),
            title=str(doc.get("title") or ""),
            body=str(doc.get("body") or ""),
            tags=[str(t) for t in (doc.get("tags") or [])],
            visibility=str(doc.get("visibility") or "public"),  # type: ignore[arg-type]
            pricing=str(doc.get("pricing") or "free"),  # type: ignore[arg-type]
            status=str(doc.get("status") or "open"),  # type: ignore[arg-type]
            author=await self._author_public(author_id),
            vote_score=int(doc.get("vote_score") or 0),
            my_vote=self._my_vote(doc.get("votes"), viewer_user_id),
            view_count=int(doc.get("view_count") or 0),
            answer_count=int(doc.get("answer_count") or 0),
            accepted_answer_id=(
                str(doc["accepted_answer_id"]) if doc.get("accepted_answer_id") else None
            ),
            bookmarked_by_me=viewer_user_id in bookmarked,
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    async def _map_answer(
        self,
        doc: Mapping[str, Any],
        *,
        viewer_user_id: str,
    ) -> CourseQaAnswerPublic:
        is_anonymous = bool(doc.get("is_anonymous"))
        author_id = str(doc.get("author_user_id") or "")
        comments_out: list[CourseQaCommentPublic] = []
        for c in doc.get("comments") or []:
            if not isinstance(c, Mapping):
                continue
            comments_out.append(
                CourseQaCommentPublic(
                    id=str(c.get("id") or ""),
                    text=str(c.get("text") or ""),
                    author=await self._author_public(str(c.get("author_user_id") or "")),
                    created_at=c["created_at"],
                )
            )
        return CourseQaAnswerPublic(
            id=str(doc["_id"]),
            question_id=str(doc["question_id"]),
            body=str(doc.get("body") or ""),
            author=await self._author_public(author_id, anonymous=is_anonymous),
            is_anonymous=is_anonymous,
            vote_score=int(doc.get("vote_score") or 0),
            my_vote=self._my_vote(doc.get("votes"), viewer_user_id),
            is_accepted=bool(doc.get("is_accepted")),
            comments=comments_out,
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    async def list_questions(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        viewer_user_id: str,
        can_manage: bool,
        q: str | None = None,
        tag: str | None = None,
    ) -> CourseQaQuestionListResponse:
        await self._require_school(org_id=org_id, school_id=school_id)
        await self._require_course(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        docs, total = await self._qa.list_questions(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            q=q,
            tag=tag,
            include_trash=False,
            viewer_user_id=viewer_user_id,
            can_manage=can_manage,
        )
        items = [await self._map_question(d, viewer_user_id=viewer_user_id) for d in docs]
        return CourseQaQuestionListResponse(items=items, total=total)

    async def create_question(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        user_id: str,
        payload: CourseQaQuestionCreateInput,
    ) -> CourseQaQuestionPublic:
        await self._require_school(org_id=org_id, school_id=school_id)
        await self._require_course(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        now = _utcnow()
        doc = {
            "_id": new_question_id(),
            "org_id": org_id,
            "school_id": school_id,
            "course_workspace_item_id": course_workspace_item_id,
            "title": payload.title.strip(),
            "body": payload.body.strip(),
            "tags": list(payload.tags),
            "visibility": payload.visibility,
            "pricing": payload.pricing,
            "status": "open",
            "author_user_id": user_id,
            "votes": {},
            "vote_score": 0,
            "view_count": 0,
            "answer_count": 0,
            "accepted_answer_id": None,
            "bookmarked_by": [],
            "created_at": now,
            "updated_at": now,
        }
        await self._qa.insert_question(doc)
        return await self._map_question(doc, viewer_user_id=user_id)

    async def get_question(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        question_id: str,
        viewer_user_id: str,
        can_manage: bool,
        increment_view: bool = True,
    ) -> CourseQaQuestionDetailPublic:
        await self._require_school(org_id=org_id, school_id=school_id)
        await self._require_course(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        doc = await self._qa.find_question(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            question_id=question_id,
        )
        if doc is None or str(doc.get("status")) == "trash":
            raise NotFoundError("Question not found.", code="course_qa_question_not_found")
        if str(doc.get("visibility")) == "private":
            if not can_manage and str(doc.get("author_user_id")) != viewer_user_id:
                raise PermissionDeniedError(
                    "This question is private.",
                    code="course_qa_question_private",
                )
        if increment_view:
            await self._qa.increment_view_count(
                org_id=org_id,
                school_id=school_id,
                course_workspace_item_id=course_workspace_item_id,
                question_id=question_id,
            )
            doc = await self._qa.find_question(
                org_id=org_id,
                school_id=school_id,
                course_workspace_item_id=course_workspace_item_id,
                question_id=question_id,
            )
            assert doc is not None
        question = await self._map_question(doc, viewer_user_id=viewer_user_id)
        answers_raw = await self._qa.list_answers(
            org_id=org_id, school_id=school_id, question_id=question_id
        )
        answers = [await self._map_answer(a, viewer_user_id=viewer_user_id) for a in answers_raw]
        return CourseQaQuestionDetailPublic.model_validate(
            {**question.model_dump(), "answers": [a.model_dump() for a in answers]}
        )

    async def update_question(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        question_id: str,
        user_id: str,
        can_manage: bool,
        payload: CourseQaQuestionUpdateInput,
    ) -> CourseQaQuestionPublic:
        doc = await self._qa.find_question(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            question_id=question_id,
        )
        if doc is None:
            raise NotFoundError("Question not found.", code="course_qa_question_not_found")
        is_author = str(doc.get("author_user_id")) == user_id
        if not is_author and not can_manage:
            raise PermissionDeniedError(
                "Only the author or a school manager can update this question.",
                code="course_qa_question_forbidden",
            )
        patch: dict[str, Any] = {}
        if payload.title is not None:
            patch["title"] = payload.title.strip()
        if payload.body is not None:
            patch["body"] = payload.body.strip()
        if payload.tags is not None:
            patch["tags"] = list(payload.tags)[:5]
        if payload.visibility is not None:
            patch["visibility"] = payload.visibility
        if payload.pricing is not None:
            patch["pricing"] = payload.pricing
        if payload.status is not None:
            if payload.status == "trash" and not (is_author or can_manage):
                raise PermissionDeniedError(
                    "Cannot move this question to trash.",
                    code="course_qa_question_forbidden",
                )
            patch["status"] = payload.status
        if not patch:
            raise ValidationError("No changes provided.", code="course_qa_question_update_empty")
        updated = await self._qa.update_question(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            question_id=question_id,
            patch=patch,
        )
        assert updated is not None
        return await self._map_question(updated, viewer_user_id=user_id)

    async def vote_question(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        question_id: str,
        user_id: str,
        payload: CourseQaVoteInput,
    ) -> CourseQaQuestionPublic:
        doc = await self._qa.find_question(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            question_id=question_id,
        )
        if doc is None or str(doc.get("status")) == "trash":
            raise NotFoundError("Question not found.", code="course_qa_question_not_found")
        current = self._my_vote(doc.get("votes"), user_id)
        next_value: int | None = int(payload.value)
        if current == next_value:
            next_value = None
        updated = await self._qa.set_question_vote(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            question_id=question_id,
            user_id=user_id,
            value=next_value,
        )
        assert updated is not None
        return await self._map_question(updated, viewer_user_id=user_id)

    async def bookmark_question(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        question_id: str,
        user_id: str,
    ) -> CourseQaQuestionPublic:
        updated = await self._qa.toggle_bookmark(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            question_id=question_id,
            user_id=user_id,
        )
        if updated is None:
            raise NotFoundError("Question not found.", code="course_qa_question_not_found")
        return await self._map_question(updated, viewer_user_id=user_id)

    async def create_answer(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        question_id: str,
        user_id: str,
        payload: CourseQaAnswerCreateInput,
    ) -> CourseQaAnswerPublic:
        q = await self._qa.find_question(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            question_id=question_id,
        )
        if q is None or str(q.get("status")) == "trash":
            raise NotFoundError("Question not found.", code="course_qa_question_not_found")
        if str(q.get("status")) == "closed":
            raise ValidationError("This question is closed.", code="course_qa_question_closed")
        now = _utcnow()
        doc = {
            "_id": new_answer_id(),
            "org_id": org_id,
            "school_id": school_id,
            "course_workspace_item_id": course_workspace_item_id,
            "question_id": question_id,
            "body": payload.body.strip(),
            "author_user_id": user_id,
            "is_anonymous": bool(payload.is_anonymous),
            "votes": {},
            "vote_score": 0,
            "is_accepted": False,
            "comments": [],
            "created_at": now,
            "updated_at": now,
        }
        await self._qa.insert_answer(doc)
        return await self._map_answer(doc, viewer_user_id=user_id)

    async def update_answer(
        self,
        *,
        org_id: str,
        school_id: str,
        answer_id: str,
        user_id: str,
        can_manage: bool,
        payload: CourseQaAnswerUpdateInput,
    ) -> CourseQaAnswerPublic:
        doc = await self._qa.find_answer(org_id=org_id, school_id=school_id, answer_id=answer_id)
        if doc is None:
            raise NotFoundError("Answer not found.", code="course_qa_answer_not_found")
        if str(doc.get("author_user_id")) != user_id and not can_manage:
            raise PermissionDeniedError(
                "Only the author or a school manager can update this answer.",
                code="course_qa_answer_forbidden",
            )
        if payload.body is None:
            raise ValidationError("No changes provided.", code="course_qa_answer_update_empty")
        updated = await self._qa.update_answer(
            org_id=org_id,
            school_id=school_id,
            answer_id=answer_id,
            patch={"body": payload.body.strip()},
        )
        assert updated is not None
        return await self._map_answer(updated, viewer_user_id=user_id)

    async def vote_answer(
        self,
        *,
        org_id: str,
        school_id: str,
        answer_id: str,
        user_id: str,
        payload: CourseQaVoteInput,
    ) -> CourseQaAnswerPublic:
        doc = await self._qa.find_answer(org_id=org_id, school_id=school_id, answer_id=answer_id)
        if doc is None:
            raise NotFoundError("Answer not found.", code="course_qa_answer_not_found")
        current = self._my_vote(doc.get("votes"), user_id)
        next_value: int | None = int(payload.value)
        if current == next_value:
            next_value = None
        updated = await self._qa.set_answer_vote(
            org_id=org_id,
            school_id=school_id,
            answer_id=answer_id,
            user_id=user_id,
            value=next_value,
        )
        assert updated is not None
        return await self._map_answer(updated, viewer_user_id=user_id)

    async def approve_answer(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        question_id: str,
        answer_id: str,
        user_id: str,
        can_manage: bool,
    ) -> CourseQaQuestionDetailPublic:
        q = await self._qa.find_question(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            question_id=question_id,
        )
        if q is None:
            raise NotFoundError("Question not found.", code="course_qa_question_not_found")
        if str(q.get("author_user_id")) != user_id and not can_manage:
            raise PermissionDeniedError(
                "Only the question author or a school manager can approve an answer.",
                code="course_qa_approve_forbidden",
            )
        a = await self._qa.find_answer(org_id=org_id, school_id=school_id, answer_id=answer_id)
        if a is None or str(a.get("question_id")) != question_id:
            raise NotFoundError("Answer not found.", code="course_qa_answer_not_found")
        await self._qa.accept_answer(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            question_id=question_id,
            answer_id=answer_id,
        )
        return await self.get_question(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            question_id=question_id,
            viewer_user_id=user_id,
            can_manage=can_manage,
            increment_view=False,
        )

    async def comment_on_answer(
        self,
        *,
        org_id: str,
        school_id: str,
        answer_id: str,
        user_id: str,
        payload: CourseQaCommentCreateInput,
    ) -> CourseQaAnswerPublic:
        comment = {
            "id": new_comment_id(),
            "text": payload.text.strip(),
            "author_user_id": user_id,
            "created_at": _utcnow(),
        }
        updated = await self._qa.append_answer_comment(
            org_id=org_id,
            school_id=school_id,
            answer_id=answer_id,
            comment=comment,
        )
        if updated is None:
            raise NotFoundError("Answer not found.", code="course_qa_answer_not_found")
        return await self._map_answer(updated, viewer_user_id=user_id)
