"""Business logic for course Exercise & Test."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping
from uuid import uuid4

from app.core.exceptions import NotFoundError, ValidationError
from app.domain.course_exercise.repository import CourseExerciseRepository, new_exercise_id
from app.domain.course_exercise.schemas import (
    CourseExerciseAuthorPublic,
    CourseExerciseCreateInput,
    CourseExerciseListResponse,
    CourseExercisePublic,
    CourseExerciseUpdateInput,
    ExerciseMatchingItemPublic,
    ExerciseOptionPublic,
    ExerciseQuestionPublic,
    ExerciseQuestionVariantPublic,
)
from app.domain.ghost_resources.repository import GhostResourcesRepository
from app.domain.school.repository import Repository as SchoolRepository


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _new_qid(prefix: str = "q") -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


def default_question_doc() -> dict[str, Any]:
    variant_id = _new_qid("qv")
    return {
        "id": _new_qid("q"),
        "order": 0,
        "active_variant_id": variant_id,
        "variants": [
            {
                "id": variant_id,
                "name": "Variant 1",
                "type": None,
                "stem_html": "",
                "stem_ghosted": False,
                "options": [],
                "matching_description": "",
                "column_a": [],
                "column_b": [],
                "blanks": [],
                "ordering_items": [],
                "writing_prompt": "",
            }
        ],
    }


def _normalize_questions(raw: list[Any] | None) -> list[dict[str, Any]]:
    if not raw:
        return [default_question_doc()]
    out: list[dict[str, Any]] = []
    for index, item in enumerate(raw):
        if not isinstance(item, dict):
            continue
        qid = str(item.get("id") or _new_qid("q"))
        variants_raw = item.get("variants")
        if not isinstance(variants_raw, list) or not variants_raw:
            variants_raw = [default_question_doc()["variants"][0]]
        variants: list[dict[str, Any]] = []
        for v in variants_raw:
            if not isinstance(v, dict):
                continue
            vid = str(v.get("id") or _new_qid("qv"))
            options_raw = v.get("options") if isinstance(v.get("options"), list) else []
            options: list[dict[str, Any]] = []
            for opt in options_raw:
                if not isinstance(opt, dict):
                    continue
                options.append(
                    {
                        "id": str(opt.get("id") or _new_qid("opt")),
                        "label": str(opt.get("label") or ""),
                        "text": str(opt.get("text") or ""),
                        "is_correct": bool(opt.get("isCorrect", opt.get("is_correct", False))),
                        "ghosted": bool(opt.get("ghosted", False)),
                        "image_url": str(opt.get("imageUrl") or opt.get("image_url") or "").strip(),
                    }
                )

            def _items(key_camel: str, key_snake: str) -> list[dict[str, Any]]:
                src = v.get(key_camel)
                if src is None:
                    src = v.get(key_snake)
                if not isinstance(src, list):
                    return []
                items: list[dict[str, Any]] = []
                for row in src:
                    if not isinstance(row, dict):
                        continue
                    items.append(
                        {
                            "id": str(row.get("id") or _new_qid("mi")),
                            "text": str(row.get("text") or ""),
                        }
                    )
                return items

            variants.append(
                {
                    "id": vid,
                    "name": str(v.get("name") or "Variant 1"),
                    "type": v.get("type"),
                    "stem_html": str(v.get("stemHtml") or v.get("stem_html") or ""),
                    "stem_ghosted": bool(v.get("stemGhosted", v.get("stem_ghosted", False))),
                    "options": options,
                    "matching_description": str(
                        v.get("matchingDescription") or v.get("matching_description") or ""
                    ),
                    "column_a": _items("columnA", "column_a"),
                    "column_b": _items("columnB", "column_b"),
                    "blanks": [str(b) for b in (v.get("blanks") or []) if str(b).strip()],
                    "ordering_items": _items("orderingItems", "ordering_items"),
                    "writing_prompt": str(v.get("writingPrompt") or v.get("writing_prompt") or ""),
                }
            )
        if not variants:
            variants = list(default_question_doc()["variants"])
        active = str(item.get("activeVariantId") or item.get("active_variant_id") or variants[0]["id"])
        if not any(str(v["id"]) == active for v in variants):
            active = str(variants[0]["id"])
        out.append(
            {
                "id": qid,
                "order": int(item.get("order", index)),
                "active_variant_id": active,
                "variants": variants,
            }
        )
    return out or [default_question_doc()]


class CourseExerciseService:
    def __init__(
        self,
        *,
        exercise_repo: CourseExerciseRepository,
        school_repo: SchoolRepository,
        ghost_repo: GhostResourcesRepository | None = None,
    ) -> None:
        self._ex = exercise_repo
        self._school = school_repo
        self._ghost = ghost_repo

    async def bootstrap(self) -> None:
        await self._ex.ensure_indexes()

    async def _detach_if_ghost_fulfilled(self, doc: dict[str, Any]) -> dict[str, Any]:
        """If the linked ghost was already fulfilled, publish and clear ghostId (legacy heals)."""
        ghost_id = str(doc.get("ghost_id") or "").strip()
        if not ghost_id or self._ghost is None:
            return doc
        ghost = await self._ghost.find_instance(
            org_id=str(doc.get("org_id") or ""),
            school_id=str(doc.get("school_id") or ""),
            ghost_id=ghost_id,
        )
        if ghost is None or str(ghost.get("status") or "") != "fulfilled":
            return doc
        title = str(ghost.get("title") or "").strip() or str(doc.get("title") or "").strip() or "Exercise"
        updated = await self._ex.update(
            org_id=str(doc["org_id"]),
            school_id=str(doc["school_id"]),
            course_workspace_item_id=str(doc["course_workspace_item_id"]),
            exercise_id=str(doc["_id"]),
            patch={
                "status": "published",
                "title": title,
                "ghost_id": "",
                "ghost_end_variant_id": "",
                "published_at": _utcnow(),
            },
        )
        return updated if isinstance(updated, dict) else doc
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

    def _map_questions(self, doc: Mapping[str, Any]) -> list[ExerciseQuestionPublic]:
        raw = doc.get("questions")
        if not isinstance(raw, list):
            return []
        questions: list[ExerciseQuestionPublic] = []
        for item in raw:
            if not isinstance(item, dict):
                continue
            variants: list[ExerciseQuestionVariantPublic] = []
            for v in item.get("variants") or []:
                if not isinstance(v, dict):
                    continue
                options = [
                    ExerciseOptionPublic(
                        id=str(o.get("id") or ""),
                        label=str(o.get("label") or ""),
                        text=str(o.get("text") or ""),
                        is_correct=bool(o.get("is_correct", False)),
                        ghosted=bool(o.get("ghosted", False)),
                        image_url=str(o.get("image_url") or ""),
                    )
                    for o in (v.get("options") or [])
                    if isinstance(o, dict)
                ]
                col_a = [
                    ExerciseMatchingItemPublic(id=str(r.get("id") or ""), text=str(r.get("text") or ""))
                    for r in (v.get("column_a") or [])
                    if isinstance(r, dict)
                ]
                col_b = [
                    ExerciseMatchingItemPublic(id=str(r.get("id") or ""), text=str(r.get("text") or ""))
                    for r in (v.get("column_b") or [])
                    if isinstance(r, dict)
                ]
                ordering = [
                    ExerciseMatchingItemPublic(id=str(r.get("id") or ""), text=str(r.get("text") or ""))
                    for r in (v.get("ordering_items") or [])
                    if isinstance(r, dict)
                ]
                qtype = v.get("type")
                variants.append(
                    ExerciseQuestionVariantPublic(
                        id=str(v.get("id") or ""),
                        name=str(v.get("name") or "Variant 1"),
                        type=qtype if qtype in {
                            "mcq",
                            "true_false",
                            "fill_blank",
                            "matching",
                            "writing",
                            "ordering",
                        } else None,
                        stem_html=str(v.get("stem_html") or ""),
                        stem_ghosted=bool(v.get("stem_ghosted", False)),
                        options=options,
                        matching_description=str(v.get("matching_description") or ""),
                        column_a=col_a,
                        column_b=col_b,
                        blanks=[str(b) for b in (v.get("blanks") or [])],
                        ordering_items=ordering,
                        writing_prompt=str(v.get("writing_prompt") or ""),
                    )
                )
            if not variants:
                continue
            active = str(item.get("active_variant_id") or variants[0].id)
            questions.append(
                ExerciseQuestionPublic(
                    id=str(item.get("id") or ""),
                    order=int(item.get("order") or 0),
                    active_variant_id=active,
                    variants=variants,
                )
            )
        return questions

    async def _map(self, doc: Mapping[str, Any]) -> CourseExercisePublic:
        status = str(doc.get("status") or "draft")
        if status == "active":
            status = "published"
        if status not in {"draft", "published", "deleted"}:
            status = "draft"
        visibility = str(doc.get("visibility") or "public")
        if visibility not in {"public", "private", "unlisted"}:
            visibility = "public"
        questions = self._map_questions(doc)
        total_q = int(doc.get("total_questions") or 0)
        if questions and total_q == 0:
            total_q = len(questions)
        return CourseExercisePublic(
            id=str(doc["_id"]),
            org_id=str(doc["org_id"]),
            school_id=str(doc["school_id"]),
            course_workspace_item_id=str(doc["course_workspace_item_id"]),
            kind=str(doc.get("kind") or "exercise"),  # type: ignore[arg-type]
            title=str(doc.get("title") or ""),
            time_taken=str(doc.get("time_taken") or ""),
            time_minutes=(
                int(doc["time_minutes"]) if doc.get("time_minutes") is not None else None
            ),
            total_questions=total_q,
            total_mark=(int(doc["total_mark"]) if doc.get("total_mark") is not None else None),
            take_with_friend=bool(doc.get("take_with_friend", False)),
            visibility=visibility,  # type: ignore[arg-type]
            status=status,  # type: ignore[arg-type]
            cover_image_url=str(doc.get("cover_image_url") or ""),
            org_label=str(doc.get("org_label") or ""),
            ghost_id=(str(doc["ghost_id"]).strip() or None) if doc.get("ghost_id") else None,
            questions=questions,
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
        items = []
        for d in docs:
            healed = await self._detach_if_ghost_fulfilled(dict(d))
            items.append(await self._map(healed))
        return CourseExerciseListResponse(items=items, total=total)

    async def get_exercise(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        exercise_id: str,
    ) -> CourseExercisePublic:
        await self._require_course(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        doc = await self._ex.find(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            exercise_id=exercise_id,
        )
        if doc is None or str(doc.get("status")) == "deleted":
            raise NotFoundError("Exercise not found.", code="course_exercise_not_found")
        healed = await self._detach_if_ghost_fulfilled(dict(doc))
        return await self._map(healed)

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
        questions = _normalize_questions(payload.questions)
        status = payload.status if payload.status != "deleted" else "draft"
        time_taken = payload.time_taken.strip()
        if not time_taken and payload.time_minutes is not None:
            time_taken = f"{payload.time_minutes} minute"
        doc = {
            "_id": new_exercise_id(),
            "org_id": org_id,
            "school_id": school_id,
            "course_workspace_item_id": course_workspace_item_id,
            "kind": payload.kind,
            "title": payload.title.strip() or "New Exercise",
            "time_taken": time_taken,
            "time_minutes": payload.time_minutes,
            "total_questions": max(int(payload.total_questions), len(questions)),
            "total_mark": payload.total_mark,
            "take_with_friend": bool(payload.take_with_friend),
            "visibility": payload.visibility,
            "status": status,
            "cover_image_url": payload.cover_image_url.strip(),
            "org_label": payload.org_label.strip(),
            "questions": questions,
            "created_by_user_id": user_id,
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
        if payload.time_minutes is not None:
            patch["time_minutes"] = payload.time_minutes
            if "time_taken" not in patch:
                patch["time_taken"] = f"{payload.time_minutes} minute"
        if payload.total_questions is not None:
            patch["total_questions"] = int(payload.total_questions)
        if payload.total_mark is not None:
            patch["total_mark"] = payload.total_mark
        if payload.take_with_friend is not None:
            patch["take_with_friend"] = payload.take_with_friend
        if payload.visibility is not None:
            patch["visibility"] = payload.visibility
        if payload.status is not None and payload.status != "deleted":
            patch["status"] = payload.status
        if payload.cover_image_url is not None:
            patch["cover_image_url"] = payload.cover_image_url.strip()
        if payload.org_label is not None:
            patch["org_label"] = payload.org_label.strip()
        if payload.questions is not None:
            questions = _normalize_questions(payload.questions)
            patch["questions"] = questions
            patch["total_questions"] = len(questions)
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
