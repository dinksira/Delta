# 13 — Exercise Ghosts

**Status:** Phase 0–1 in progress (entry + draft link + Open work)  
**Parent:** [Ghost resource kinds](./12-ghost-resource-kinds.md) · [Ghost Resources](./11-ghost-resources.md) · [School](./01-school.md)  
**Surfaces:** Course **Exercise & Test → Exercise** (and Test) tab; Ghost Ops Management Table; **full-page builder** → [14 — Exercise creation workspace](./14-exercise-creation-workspace.md)  
**Related:** [`course_exercise`](../../deltalabs-backend/app/domain/course_exercise/) · Ghost drawer · Host adapters

Exercise (and Test) ghosts are **one band** on the spectrum in [§12](./12-ghost-resource-kinds.md). **Build the workspace in §14 first**; this doc is how ghosts attach to it.

---

## 0. One-line

An **Exercise Ghost** is a work-order to produce a **real Delta Labs exercise**. Chain variants are **dependency parts** (image, TF section, …). Assignees build **inside DeltaLabs**; when approved and fulfilled, students can take the exercise.

---

## 1. Product rules (locked for this kind)

| Rule | Meaning |
|------|---------|
| **Context sets kind** | Opening ghost from Exercise tab ⇒ `resourceKind: exercise` (Test tab ⇒ `test`). Not a generic `document`. |
| **Ghost = order** | Property + Chain define what must be produced; L3 is the published takeable exercise. |
| **Variants = parts** | Image for a question, TF section, etc. → assign → approve → end exercise **uses** that output. |
| **Dual work modes** | Deps may be **external** (image made elsewhere → upload). End exercise is **in-product** (builder). |
| **Same builder** | Ghost assignees use the **same** exercise builder normal “Create exercise” will use later. Ghost-first is OK while normal create is thin. |
| **MT = ops** | Board tracks people/status/blocked; **Open work** opens the builder (Figma-like: board ≠ canvas). |

```text
Exercise tab
  → Exercise ghost (resourceKind=exercise)
       ├── End node ─────────── Exercise draft (in-app builder)
       ├── Variant: image ───── media asset (upload or external)
       └── Variant: TF section ── exercise_section draft
              │ approve + attach_output
              ▼
         End builder “Inputs ready” → insert into questions
              │ approve + fulfill
              ▼
         L3 CourseExercise → students take it
```

---

## 2. Why current ghosts are not enough (for exercise)

Baseline before Exercise Ghosts (see also §11 / §12):

- Submit/approve was mostly **status**; no real deliverable viewer.
- Fulfill for exercise slots wrote `metadata.ghostFulfilled[]` (library adapter), **not** a published exercise.
- MT “Open ghost” opens the drawer, not an exercise canvas.

**Now (Phase 0–1):** Exercise/Test tab sets `resourceKind`; create spawns a linked draft; Chain **Open work** opens the §14 builder. Fulfill → L3 and dependency inputs remain later phases.

---

## 3. Target architecture (exercise band)

### 3.1 Typed kind at entry

| Tab | `resourceKind` | `slotKey` |
|-----|----------------|-----------|
| Exercise | `exercise` | `exercise.resource` |
| Test | `test` | `test.resource` |

Work surface: `exercise_builder` ([§12](./12-ghost-resource-kinds.md)).

### 3.2 Working head points at content

**End node:**

```json
{
  "version": 3,
  "mode": "same_base",
  "contentType": "exercise_draft",
  "exerciseDraftId": "exd_…"
}
```

**Dependency variants (examples):**

```json
{ "contentType": "media_asset", "mediaId": "…" }
{ "contentType": "exercise_section", "sectionDraftId": "…" }
```

On upstream **approve**, graph `attach_output` fills end `available_inputs[]`. Builder shows **Use input**.

### 3.3 Exercise content model (new)

- **Draft** `status: draft | in_review | published`
- **Sections[]** (optional)
- **Questions[]**: `mcq | true_false | short_text | media_prompt` + prompt, choices, media refs, points
- Optional `ghostId` / `endVariantId` for ghost-owned drafts

Catalog `CourseExercise` = published L3; draft = WIP.

### 3.4 Host adapter

**`CourseExerciseHostAdapter`**: fulfill publishes draft → L3 exercise on that course.

### 3.5 Management Table

- **Open work** → exercise builder for that node  
- Assignees + status + blocked-by  
- Ready when upstream inputs attached  

---

## 4. Phases (exercise specialization)

### Phase 0 — Entry contract

- [`CourseExercisePanel.tsx`](../../deltalabs-frontend/src/modules/School/course/CourseExercisePanel.tsx): `resourceKind: "exercise" | "test"`. ✅
- Drawer label: “Exercise ghost” / “Test ghost”. ✅

### Phase 1 — Ghost-first draft + builder shell

- BE: on create (and `POST …/ensure-exercise-draft`), end `working_head` → `contentType: exercise_draft` + `exerciseDraftId` (CourseExercise `draft`). ✅
- FE: Chain **Open work** → [`ExerciseCreationWorkspace`](./14-exercise-creation-workspace.md) edit route. ✅
- Submit / review against draft version. (pending)
- Node DTO exposes `workingHead` for clients. ✅

### Phase 2 — Dependency variants → inputs

- `media_asset`, `exercise_section`.
- Builder “Inputs ready” from `available_inputs`.

### Phase 3 — MT + assignee progress

- **Assignee required** to edit/save/submit end-node exercise work (managers override). ✅
- Ghost Ops **Assignee** column: Monday-style **multi-person** cell → `assignee_user_ids[]`; MT write-back. ✅
- MT **Open work** / Chain Open work → same builder; non-assignees read-only. ✅
- My work UI; blocked/ready badges. (pending)

### Phase 4 — Fulfill → student L3

- Publish adapter; Exercise tab shows takeable card.

### Phase 5 — Unify normal create

- Same builder without ghost; ghost path stays for multi-person production.

---

## 5. Non-goals (this doc)

- Implementing roadmap / summary / all §12 kinds here.
- Auto-generating full Chain from AI.
- Editing exercise content inside MT cells.

---

## 6. Acceptance

| ID | Check |
|----|--------|
| EG-01 | Create from Exercise tab ⇒ `resourceKind=exercise` | ✅ entry |
| EG-02 | Open work ⇒ Exercise builder | ✅ Chain |
| EG-03 | Approved image variant insertable into a question | pending |
| EG-04 | MT Open work opens same draft | ✅ |
| EG-05 | Unassigned / non-assignee cannot save ghost-linked exercise | ✅ |
| EG-05 | Fulfill → CourseExercise on Exercise tab | pending |
| EG-06 | Simple image ghost elsewhere still upload-only ([§12 Wave A](./12-ghost-resource-kinds.md)) | unchanged |

---

## 7. Next build step

**Phase 1 wrap:** submit/review tied to draft version; then Phase 2 inputs / Phase 3 MT Open work. Keep §12 spectrum in mind so APIs stay kind-pluggable.
