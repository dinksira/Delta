# 16 — Score (School course)

**Status:** Phase 0–1 first slice (Direct View board + Management Table catalog)  
**Parent:** [School](./01-school.md) · [Exercise & Test](./13-exercise-and-test.md)  
**Surfaces:** Course **Score** tab

---

## 0. One-line

Course **Score** shows a ranked student board (Direct View) with expandable assessments (Mid / Final / Quiz by default), plus a Score-scoped Management Table catalog (no Ghost Ops).

---

## 1. What shipped (Phase 0–1)

| Piece | Behavior |
|-------|----------|
| Nav | `?nav=score` opens `CourseScorePanel` (built section) |
| Direct View | Table: Student, Rank, Last update, Status bar, Total; expand row → assessment lines |
| API | `GET/PUT …/courses/{id}/scoreboard`; `POST …/scoreboard/seed-demo` (managers) |
| Defaults | Mid Exam / Final Exam / Quiz @ 30 pts each |
| MT | Course tables with `surface: score` only (Ghost Ops hidden) |

---

## 2. Deferred

- Live sync from Exercise/Test attempt grades
- Inline cell editing UI for points
- Class-host scoreboards / weights UI
- Parent/guardian “subtitle” from real enrollment data

---

## 3. Acceptance

| ID | Check |
|----|--------|
| SC-01 | Score nav opens panel (not Coming soon) |
| SC-02 | Empty board + manager “Load sample board” matches Figma layout |
| SC-03 | Expand row shows Mid / Final / Quiz with points and status |
| SC-04 | Management Table shows Score tables only (no Ghost Ops) |
