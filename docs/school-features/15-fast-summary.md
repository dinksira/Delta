# 15 — Fast Summary (School course)

**Status:** Phase 0–1 first slice shipped (entry + draft + Open work + fulfill)  
**Parent:** [Ghost resource kinds](./12-ghost-resource-kinds.md) · [Ghost Resources](./11-ghost-resources.md) · [School](./01-school.md)  
**Surfaces:** Course **Fast Summary** tab; Ghost Ops Management Table; thin **summary composer**

Fast Summary is one band on the §12 spectrum (`resourceKind: fast_summary`). This slice mirrors Exercise/Test parity — not the full Word ribbon or live AI generate.

---

## 0. One-line

A **Fast Summary Ghost** (or direct **+ Create**) produces a **published course summary**. Assignees edit in a thin composer; fulfill / publish clears the ghost link so Direct View shows a real card.

---

## 1. What shipped (Phase 0–1)

| Piece | Behavior |
|-------|----------|
| Nav | `?nav=summary` opens `CourseFastSummaryPanel` (not Coming soon) |
| Direct View | Empty state, **+ Create** modal (title / type / section / layout), ghost button, summary cards |
| Composer | `/summaries/:id/edit` — title + body HTML, Save draft / Publish; AI prompt stub only |
| Ghost | `resourceKind: fast_summary`, slot `course.summary.resource`; end `working_head.summaryDraftId` |
| Open work | Drawer / Ghost Ops → ensure summary draft → composer |
| Fulfill | `CourseFastSummaryHostAdapter` publishes draft, clears `ghostId` |
| MT | Reuses course Ghost Ops board |

---

## 2. Deferred

- Full Word-like ribbon (Home / Insert / Dictate / tags)
- Real AI / roadmap generate
- Class-host summaries; media chain variants (voiceover / b-roll)
- Legacy `modules/Course` FastSummary lobby rework

---

## 3. Acceptance

| ID | Check |
|----|--------|
| FS-01 | Fast Summary nav opens panel |
| FS-02 | Create modal → draft → edit → publish → card |
| FS-03 | Ghost → Open work → composer → fulfill → real card |
| FS-04 | Ghost Ops Open work for `fast_summary` |
