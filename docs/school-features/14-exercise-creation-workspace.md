# 14 — Exercise creation workspace (UI source of truth)

**Status:** Design-locked from Figma (implement against this)  
**Parent:** [Exercise Ghosts](./13-exercise-ghosts.md) · [Ghost resource kinds](./12-ghost-resource-kinds.md) · [School](./01-school.md)  
**Surfaces:** Full-page **New Exercise** workspace (not the Ghost drawer; not an MT cell editor)

This is the **normal exercise builder**. Ghosts later open **this same page** (or the same components) for assignees. Build this first; wire ghost Open work second.

---

## 0. One-line

A full-page School workspace: **question canvas (left/center) + exercise settings sidebar (right)**, with Q tabs, per-question type editors, optional **variants**, and **ghost markers** on content blocks that can be ordered out to other people.

---

## 1. Page chrome (outside the exercise)

| Zone | Content |
|------|---------|
| App top bar | Hamburger · cube logo · workspace tabs (**School** / **Cathedral**) · language · bot · avatar (**John**) |
| Exercise header | Back · doc/question icon · title (**New Exercise**) · **Integrate** · **Automate** · **Invite** · link |

Title in the header tracks the sidebar **Rename** field (or shows draft name).

---

## 2. Layout (full page)

```text
┌──────────────────────────────── App top bar ────────────────────────────────┐
├──────────────────────────── Exercise header ────────────────────────────────┤
│ Back  New Exercise                          Integrate  Automate  Invite  🔗 │
├───────────────────────────────────────────────┬─────────────────────────────┤
│  MAIN CANVAS (~70%)                           │  RIGHT SIDEBAR (~30%)       │
│                                               │  [Save as Draft] [Publish]  │
│  [Q1] [Q2] [+]                                │  Exercise Features | Resources│
│  (optional) Variant ▾                         │  Configure ▾                │
│  Question type ▾  /  type-specific editor     │    Rename                   │
│                                               │    Total Mark               │
│                                               │    Time Given               │
│                                               │    Take with friend  ○─     │
│                                               │  Visibility ▾               │
│                                               │    Visibility: Public       │
│                                               │    Move to Trash            │
└───────────────────────────────────────────────┴─────────────────────────────┘
```

- Full viewport under School chrome — **not** a drawer, **not** nested inside Exercise & Test list only as a modal.
- Sidebar is fixed-width; canvas scrolls independently if needed.
- Primary publish actions live **only** in the sidebar top (Draft / Publish), not duplicated in the header.

---

## 3. Question list (canvas top)

| Control | Behavior |
|---------|----------|
| **Q1.** **Q2.** … | Horizontal chips/tabs; active = light blue fill + border |
| **+** | Appends a new question; selects it; starts in empty / type-pick state |
| Order | Left → right = exercise order (later: drag reorder if design adds it) |

Selecting a Q tab switches the entire canvas body to that question’s editor. Sidebar stays **exercise-level** (does not change per Q except maybe marks rollup).

---

## 4. Question types (picker)

Empty / pre-type state:

- Dropdown or open menu: **Question type**
- Center empty illustration: **“Select Question Type”** / **“No question selected!”**

Confirmed types from design:

| Type | Editor summary |
|------|----------------|
| **Multiple Choice** | Rich-text stem + options A, B, … · + Add Option · correct-answer radio later |
| **True/False** | Stem + T/F (same family as MCQ with fixed options — confirm in build) |
| **Fill-in-the-Blanks** | Stem with blank tokens (detail in build) |
| **Matching Questions** | Matching description · **Column A** / **Column B** · per-column + Add Option · row delete |
| **Writing** | Long prompt / rubric fields (detail in build) |
| **Ordering/Sequencing** | Ordered list of items (detail in build) |

**Matching (designed):**

- Label **Matching** + **Matching Description** textarea (`here..`)
- Two grey headers: **Column A** | **Column B**
- Rows: index/letter · label · delete (X); Column A shows expand/chevron on rows in mock
- Each column: **+ Add Option**

**Multiple choice (designed):**

- Title **Multiple Choice Question**
- Hint: **Describe question briefly.**
- Rich-text stem (toolbar: undo/redo, style, lists, B/I/U/strike, link, image)
- Options as pill rows with radio · **A.** / **B.** · delete on some · **+ Add Option**

---

## 5. Variants (per question)

Under the Q tabs, a dropdown e.g. **Variant12** / **Variant 12**.

Product meaning (aligned with ghost spectrum):

- A **question** can have multiple **variants** (alternate versions of that Q).
- Collaborators may own a variant (Same Base / Branch later).
- Ghost chain can map a **variant node** ↔ a question variant or a **ghosted block** inside a question.

v1 builder: persist `question.variants[]` with one active `variantId` in the UI dropdown. Do not block shipping MCQ/Matching on full ghost sync — wire Open work later.

---

## 6. Ghost affordances (in-canvas)

Design shows a **ghost icon** on:

- Bottom-right of the **rich-text stem** card
- Right side of an **option** row (e.g. option B)

Meaning:

- Mark that **block** (stem, option, later image/blank) as a **ghost dependency** — “someone else produces this.”
- Creates / links a ghost variant (or sub-resource) with the right `contentType` (`media_asset`, text block, etc.).
- While ghosted: block shows placeholder / locked / status; when fulfilled, content fills in.

**Resources** sidebar tab = inventory of attached / ghosted assets for this exercise (images, upstream outputs). Exact Resources UI not fully shown in mocks — treat as list of inputs + attach.

**Invite** in the header = people into the exercise workspace (and later into ghost assignees).

---

## 7. Right sidebar (exercise-level)

### Top actions

| Button | Role |
|--------|------|
| **Save as Draft** | Persist draft; stay on page |
| **Publish** | Promote to student-visible L3 exercise (catalog card on Exercise tab) |

### Tabs

| Tab | Role |
|-----|------|
| **Exercise Features** | Configure + Visibility (shown) |
| **Resources** | Exercise-scoped assets / ghost inputs (stub OK in v1) |

### Configure

| Field | Notes |
|-------|--------|
| **Rename** | Exercise title (sync header) |
| **Total Mark** | Points; may auto-sum from questions later |
| **Time Given** | Minutes |
| **Take with friend** | Toggle |

### Visibility

| Field | Notes |
|-------|--------|
| **Visibility** | e.g. Public (dropdown) |
| **Move to Trash** | Destructive; red text |

Sections are **collapsible** (Configure ▾, Visibility ▾).

---

## 8. Data model sketch (builder v1)

```text
ExerciseDraft
  id, courseId?, title, status: draft|published|trashed
  totalMark?, timeMinutes?, takeWithFriend, visibility
  questions[]: {
    id, order
    activeVariantId
    variants[]: {
      id, name
      type: mcq|true_false|fill_blank|matching|writing|ordering
      // type-specific payload
      stemRichText?
      options?: [{ id, label, text, isCorrect?, ghostRef? }]
      matching?: { description, columnA[], columnB[], pairs? }
      ghostRefs?: [{ blockPath, ghostId?, variantId?, status }]
    }
  }
  resourceIds[]?
```

Ghost later: `working_head.exerciseDraftId` → this document; ghost icon writes `ghostRefs` / creates chain nodes.

---

## 9. Implementation phases (this workspace)

| Phase | Ship |
|-------|------|
| **E0** | Full-page route/shell: header + empty canvas + sidebar (Draft/Publish stubs, Configure fields) |
| **E1** | Q tabs + type picker + empty state |
| **E2** | MCQ editor (stem RTE + options) + Matching editor |
| **E3** | Remaining types (T/F, fill blank, writing, ordering) — can stagger |
| **E4** | Persist draft API; Publish → course exercise catalog |
| **E5** | Variant dropdown (multi-variant per Q) |
| **E6** | Ghost icon on blocks + Resources tab + Invite hooks → §12/§13 |

Do **not** wait for E5–E6 to ship E0–E4. Ghosts attach to a working builder.

---

## 10. Entry points

| From | Opens |
|------|--------|
| Course → Exercise & Test → Create / card edit | This workspace (`/…/exercises/new` or `/…/exercises/{id}/edit`) |
| Ghost MT / drawer **Open work** (later) | Same workspace, draft bound to ghost end node |
| Test tab | Same UI with `kind: test` |

---

## 11. Acceptance (UI)

| ID | Check |
|----|--------|
| EW-01 | Full page matches layout: header + Q tabs + canvas + right sidebar |
| EW-02 | + adds Q; switching Q tabs preserves each question’s type/content |
| EW-03 | Until type chosen: empty “Select Question Type” state |
| EW-04 | MCQ: RTE stem + add/remove options |
| EW-05 | Matching: description + Column A/B + add/remove options |
| EW-06 | Sidebar: rename, marks, time, friend toggle, visibility, trash |
| EW-07 | Save as Draft / Publish wired to persistence (E4) |
| EW-08 | Ghost icon + Variant dropdown present in UI (can no-op until E5–E6) |

---

## 12. Design assets

Figma screens captured in chat (New Exercise empty, Matching Q2, MCQ with Variant12 + ghost icons, type menu). Keep those as visual QA when building.
