"""Business logic for course Score boards."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.core.exceptions import NotFoundError, ValidationError
from app.domain.course_score.repository import (
    CourseScoreRepository,
    new_assessment_id,
    new_entry_id,
    new_scoreboard_id,
)
from app.domain.course_score.schemas import (
    CourseScoreAssessmentInput,
    CourseScoreAssessmentPublic,
    CourseScoreBoardPublic,
    CourseScoreBoardReplaceInput,
    CourseScoreEntryInput,
    CourseScoreEntryPublic,
    CourseScoreLinePublic,
)
from app.domain.school.repository import Repository as SchoolRepository


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


_DEFAULT_ASSESSMENTS: list[tuple[str, float]] = [
    ("Mid Exam", 30.0),
    ("Final Exam", 30.0),
    ("Quiz", 30.0),
]


class CourseScoreService:
    def __init__(
        self,
        *,
        score_repo: CourseScoreRepository,
        school_repo: SchoolRepository,
    ) -> None:
        self._sc = score_repo
        self._school = school_repo

    async def bootstrap(self) -> None:
        await self._sc.ensure_indexes()

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
        if item is None or str(item.get("type") or "") != "course":
            raise NotFoundError("Course not found.", code="course_not_found")

    def _default_assessments(self) -> list[dict[str, Any]]:
        return [
            {"id": new_assessment_id(), "title": title, "max_points": max_pts}
            for title, max_pts in _DEFAULT_ASSESSMENTS
        ]

    def _compute_entry(
        self,
        *,
        entry_id: str,
        raw: CourseScoreEntryInput | dict[str, Any],
        assessments: list[dict[str, Any]],
    ) -> dict[str, Any]:
        if isinstance(raw, CourseScoreEntryInput):
            display_name = raw.display_name.strip()
            subtitle = (raw.subtitle or "").strip()
            student_user_id = (raw.student_user_id or "").strip() or None
            avatar_url = (raw.avatar_url or "").strip() or None
            lines_in = raw.lines
            updated_at = raw.updated_at or _utcnow()
            eid = (raw.id or "").strip() or entry_id
        else:
            display_name = str(raw.get("display_name") or "").strip()
            subtitle = str(raw.get("subtitle") or "").strip()
            student_user_id = str(raw.get("student_user_id") or "").strip() or None
            avatar_url = str(raw.get("avatar_url") or "").strip() or None
            lines_in = raw.get("lines") or []
            updated_at = raw.get("updated_at") or _utcnow()
            eid = str(raw.get("id") or entry_id).strip() or entry_id

        if not display_name:
            raise ValidationError("Student display name is required.", code="score_name_required")

        by_assess = {str(a["id"]): a for a in assessments}
        line_map: dict[str, float | None] = {}
        for line in lines_in:
            if hasattr(line, "assessment_id"):
                aid = str(line.assessment_id).strip()
                pts = line.points
            else:
                aid = str(line.get("assessment_id") or "").strip()
                pts_raw = line.get("points")
                pts = float(pts_raw) if pts_raw is not None and pts_raw != "" else None
            if aid in by_assess:
                max_pts = float(by_assess[aid].get("max_points") or 0)
                if pts is not None:
                    pts = max(0.0, min(float(pts), max_pts))
                line_map[aid] = pts

        lines_out: list[dict[str, Any]] = []
        total = 0.0
        max_total = 0.0
        for a in assessments:
            aid = str(a["id"])
            max_pts = float(a.get("max_points") or 0)
            max_total += max_pts
            pts = line_map.get(aid)
            if pts is not None:
                total += float(pts)
            lines_out.append({"assessment_id": aid, "points": pts, "rank": None})

        status_percent = int(round((total / max_total) * 100)) if max_total > 0 else 0
        status_percent = max(0, min(100, status_percent))

        return {
            "id": eid,
            "student_user_id": student_user_id,
            "display_name": display_name,
            "subtitle": subtitle,
            "avatar_url": avatar_url,
            "lines": lines_out,
            "total_points": total,
            "max_total": max_total,
            "status_percent": status_percent,
            "rank": 0,
            "updated_at": updated_at if isinstance(updated_at, datetime) else _utcnow(),
        }

    def _rank_entries(self, entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
        ordered = sorted(
            entries,
            key=lambda e: (-float(e.get("total_points") or 0), str(e.get("display_name") or "")),
        )
        for i, e in enumerate(ordered, start=1):
            e["rank"] = i
        # Per-assessment ranks
        if not ordered:
            return ordered
        assess_ids = [str(line["assessment_id"]) for line in ordered[0].get("lines") or []]
        for aid in assess_ids:
            scored = []
            for e in ordered:
                for line in e.get("lines") or []:
                    if str(line.get("assessment_id")) == aid and line.get("points") is not None:
                        scored.append((e["id"], float(line["points"])))
                        break
            scored.sort(key=lambda t: -t[1])
            rank_by_entry = {eid: i for i, (eid, _) in enumerate(scored, start=1)}
            for e in ordered:
                for line in e.get("lines") or []:
                    if str(line.get("assessment_id")) == aid:
                        line["rank"] = rank_by_entry.get(e["id"])
        return ordered

    def _map_public(self, doc: dict[str, Any]) -> CourseScoreBoardPublic:
        assessments = [
            CourseScoreAssessmentPublic(
                id=str(a.get("id") or ""),
                title=str(a.get("title") or ""),
                max_points=float(a.get("max_points") or 0),
            )
            for a in (doc.get("assessments") or [])
        ]
        entries = [
            CourseScoreEntryPublic(
                id=str(e.get("id") or ""),
                student_user_id=e.get("student_user_id"),
                display_name=str(e.get("display_name") or ""),
                subtitle=str(e.get("subtitle") or ""),
                avatar_url=e.get("avatar_url"),
                lines=[
                    CourseScoreLinePublic(
                        assessment_id=str(ln.get("assessment_id") or ""),
                        points=ln.get("points"),
                        rank=ln.get("rank"),
                    )
                    for ln in (e.get("lines") or [])
                ],
                total_points=float(e.get("total_points") or 0),
                max_total=float(e.get("max_total") or 0),
                status_percent=int(e.get("status_percent") or 0),
                rank=int(e.get("rank") or 0),
                updated_at=e.get("updated_at") or doc.get("updated_at") or _utcnow(),
            )
            for e in (doc.get("entries") or [])
        ]
        entries.sort(key=lambda x: x.rank or 9999)
        return CourseScoreBoardPublic(
            id=str(doc.get("_id") or ""),
            org_id=str(doc.get("org_id") or ""),
            school_id=str(doc.get("school_id") or ""),
            course_workspace_item_id=str(doc.get("course_workspace_item_id") or ""),
            assessments=assessments,
            entries=entries,
            updated_at=doc.get("updated_at") or _utcnow(),
        )

    async def get_or_create_board(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
    ) -> CourseScoreBoardPublic:
        await self._require_course(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        doc = await self._sc.find(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        if doc is None:
            now = _utcnow()
            doc = {
                "_id": new_scoreboard_id(),
                "org_id": org_id,
                "school_id": school_id,
                "course_workspace_item_id": course_workspace_item_id,
                "assessments": self._default_assessments(),
                "entries": [],
                "created_at": now,
                "updated_at": now,
            }
            await self._sc.insert(doc)
        return self._map_public(doc)

    async def replace_board(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
        payload: CourseScoreBoardReplaceInput,
    ) -> CourseScoreBoardPublic:
        await self.get_or_create_board(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        assessments_in = payload.assessments or [
            CourseScoreAssessmentInput(title=t, max_points=m) for t, m in _DEFAULT_ASSESSMENTS
        ]
        if len(assessments_in) > 40:
            raise ValidationError("Too many assessments.", code="score_assessments_limit")
        if len(payload.entries) > 500:
            raise ValidationError("Too many score entries.", code="score_entries_limit")

        assessments: list[dict[str, Any]] = []
        for a in assessments_in:
            assessments.append(
                {
                    "id": (a.id or "").strip() or new_assessment_id(),
                    "title": a.title.strip(),
                    "max_points": float(a.max_points),
                }
            )

        entries = [
            self._compute_entry(
                entry_id=new_entry_id(),
                raw=e,
                assessments=assessments,
            )
            for e in payload.entries
        ]
        entries = self._rank_entries(entries)

        doc = await self._sc.replace(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            patch={"assessments": assessments, "entries": entries},
        )
        if doc is None:
            raise NotFoundError("Scoreboard not found.", code="scoreboard_not_found")
        return self._map_public(doc)

    async def seed_demo_board(
        self,
        *,
        org_id: str,
        school_id: str,
        course_workspace_item_id: str,
    ) -> CourseScoreBoardPublic:
        """Populate Figma-like demo students for empty boards (managers only at API layer)."""
        from app.domain.course_score.schemas import CourseScoreLineInput

        await self.get_or_create_board(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
        )
        tmp_assess = [
            {"id": new_assessment_id(), "title": title, "max_points": max_pts}
            for title, max_pts in _DEFAULT_ASSESSMENTS
        ]
        mid_id, final_id, quiz_id = tmp_assess[0]["id"], tmp_assess[1]["id"], tmp_assess[2]["id"]
        demo_names = [
            ("Phillip Schleifer", "Alfonso"),
            ("Molly Armstrong", "Alfonso"),
            ("Lindsey Passaquindici Arcand", "Alfonso"),
            ("Ciara Mango", "Alfonso"),
            ("Marley Torff", "Alfonso"),
            ("Ahmad Culhane", "Alfonso"),
            ("Kadin Herwitz", "Alfonso"),
            ("Ruben Schleifer", "Alfonso"),
        ]
        score_sets = [
            (25.0, None, 25.0),
            (28.0, 27.0, 26.0),
            (22.0, 20.0, 24.0),
            (30.0, 29.0, 28.0),
            (27.0, 26.0, 25.0),
            (24.0, 23.0, 22.0),
            (26.0, 25.0, 24.0),
            (29.0, 28.0, 27.0),
        ]
        fixed: list[CourseScoreEntryInput] = []
        for (name, sub), (m, f, q) in zip(demo_names, score_sets, strict=True):
            fixed.append(
                CourseScoreEntryInput(
                    display_name=name,
                    subtitle=sub,
                    lines=[
                        CourseScoreLineInput(assessment_id=mid_id, points=m),
                        CourseScoreLineInput(assessment_id=final_id, points=f),
                        CourseScoreLineInput(assessment_id=quiz_id, points=q),
                    ],
                )
            )
        return await self.replace_board(
            org_id=org_id,
            school_id=school_id,
            course_workspace_item_id=course_workspace_item_id,
            payload=CourseScoreBoardReplaceInput(
                assessments=[
                    CourseScoreAssessmentInput(
                        id=str(a["id"]),
                        title=str(a["title"]),
                        max_points=float(a["max_points"]),
                    )
                    for a in tmp_assess
                ],
                entries=fixed,
            ),
        )
