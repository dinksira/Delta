# 12 — Ghost resource kinds (spectrum)

**Status:** Planned product architecture  
**Parent:** [Ghost Resources](./11-ghost-resources.md) · [School](./01-school.md)  
**Specializations:** [Exercise Ghosts](./13-exercise-ghosts.md) (first in-product build)  
**Point:** Ghosts are not “files only” and not “exercises only.” They are **typed work-orders** for **any** missing Delta Labs (or external) resource — from a single image up to a multi-part course product.

---

## 0. One-line

One ghost domain. Many **resource kinds**. Entry context (host + slot) picks the kind. Kind picks **how work is done** (external submit vs in-app builder) and **how fulfill publishes** L3.

---

## 1. Think in a spectrum, not one feature

```text
SIMPLE / EXTERNAL                    COMPOSITE / IN-PRODUCT
─────────────────────────────────────────────────────────────►
 image  video  PDF  slide deck       intro pack   fast summary
 audio  link   worksheet             roadmap node  Q&A pack
                                     exercise  test  lab module
                                     department handbook …
```

| End of spectrum | What the assignee does | What “Open work” opens |
|-----------------|------------------------|-------------------------|
| **External / simple** | Make it elsewhere → upload or paste URL → submit | Upload / preview sheet |
| **In-product / big** | Build inside Delta Labs with that product’s editor | Same builder students/managers will use for “normal create” |
| **Hybrid** | End is in-product; variants may be simple external parts | End = builder; deps = upload or mini-builders |

**Exercise** is one big in-product kind. **Roadmap ghost**, **test ghost**, **fast summary ghost**, **intro video ghost** are siblings on the same spectrum — not separate ghost products.

---

## 2. Universal rules (all kinds)

These stay true everywhere (see also §11):

1. **Ghost = work-order** for one missing end resource on a **host**.
2. **Context sets kind** — Exercise tab ⇒ exercise; Test tab ⇒ test; Roadmap Ghost Res. ⇒ roadmap resource; Intro empty slot ⇒ intro media; etc. Never default everything to `document`.
3. **Chain variants = production dependencies** for that end resource (image for a slide, TF section for an exercise, clip for a summary, …).
4. **Same Base / Branch Base** = collaboration mode, orthogonal to kind.
5. **Management Table** = ops (assign, status, blocked, Open ghost / **Open work**). Not the editor.
6. **Fulfill** = HostAdapter publishes **one** L3 artifact for that host+slot.
7. **New kind** = register: `resourceKind` + work surface + fulfill adapter (+ optional FE opener). **Do not** fork a new ghost domain.

```text
                    ┌─────────────────────────┐
                    │  Ghost core (one)       │
                    │  Property · Chain · MT  │
                    │  submit · review · gate │
                    └───────────┬─────────────┘
                                │
         ┌──────────────┬───────┴────────┬──────────────┐
         ▼              ▼                ▼              ▼
   WorkSurface     WorkSurface     WorkSurface    WorkSurface
   (upload)        (exercise       (roadmap        (summary
                    builder)        editor)         editor)
         │              │                │              │
         └──────────────┴───────┬────────┴──────────────┘
                                ▼
                         HostAdapter.fulfill → L3
```

---

## 3. Kind catalog (what Delta Labs can ghost)

Kinds below are a **living catalog**. Ship adapters/builders when the host surface needs them. Names are illustrative; wire as stable `resourceKind` strings.

### 3.1 Simple / mostly external

| `resourceKind` | Typical hosts / slots | Work mode | L3 after fulfill |
|----------------|----------------------|-----------|------------------|
| `image` | Class library, roadmap asset, question art | External or in-app upload | Media asset on host |
| `video` | Course intro, session recording, summary clip | Upload / URL / intro media pipeline | Playback on host |
| `audio` | Language lab, podcast lesson | Upload | Audio on host |
| `document` | PDF, worksheet, policy | Upload / link | File/doc ref |
| `slides` | PPT / deck for class or course | External (Canva/PPT) → submit file/link | Library entry |
| `link` | External tool, form, site | Paste URL | Link card |

### 3.2 In-product / composite (built in Delta Labs)

| `resourceKind` | Typical hosts / slots | Work mode | L3 after fulfill |
|----------------|----------------------|-----------|------------------|
| `exercise` | Course Exercise tab | Exercise builder (+ deps) | Takeable `CourseExercise` |
| `test` | Course Test tab | Same builder, kind=test | Takeable test |
| `roadmap_resource` | Class roadmap Ghost Res. | Roadmap resource editor / attach | Roadmap resource row |
| `fast_summary` | Course / class summary surfaces | Summary composer (text + clips + beats) | Published summary unit |
| `course_intro` | Course intro slots | Intro editor / media slots | Intro metadata + media |
| `qa_pack` | Course Q&A (later) | Q&A pack builder | Published Q&A set |
| `lab_module` | Department / school labs (later) | Lab module editor | Published module |
| `handbook` | Department (later) | Doc composer | Published handbook |

### 3.3 Hybrid pattern (most “big” ghosts)

Big kinds almost always use **simple kinds as variants**:

```text
Exercise ghost (end)
  ├── variant: image          (external or upload)
  ├── variant: video clip     (upload)
  └── variant: TF section     (mini exercise_section builder)

Fast summary ghost (end)
  ├── variant: voiceover audio
  ├── variant: b-roll video
  └── variant: key points doc

Roadmap resource ghost (end)
  ├── variant: worksheet PDF
  └── variant: demo video

Intro ghost (end)
  └── variant: cover image + main video (or single media end)
```

Upstream approve → `available_inputs` → end builder **pulls** parts in. Same graph for a PPT made of slide images or an exercise made of sections.

---

## 4. Work surfaces (plug-ins)

| Work surface id | Used by kinds | “Open work” UX |
|-----------------|---------------|----------------|
| `upload_sheet` | image, video, audio, document, slides, link | File/URL + preview |
| `exercise_builder` | exercise, test (+ `exercise_section` variants) | Full / section builder |
| `roadmap_resource_editor` | roadmap_resource | Title, body, attach inputs |
| `summary_composer` | fast_summary | Outline + media beats |
| `intro_slot_editor` | course_intro | Cover / video fields |
| `generic_rich_doc` | handbook, fallback | Rich text + embeds |

**Rule:** Ghost UI never hardcodes one editor. Resolve:

```text
resourceKind (+ node contentType) → WorkSurface → open from drawer / MT
```

External-made work still uses `upload_sheet` even if the **end** kind is big (e.g. end=exercise, dep=image).

---

## 5. Host × kind matrix (where ghosts appear)

| Host surface | Example slot | Default end kind |
|--------------|--------------|------------------|
| Course → Intro | `courseIntro.videos.intro` | `video` / `course_intro` |
| Course → Exercise & Test → Exercise | `exercise.resource` | `exercise` |
| Course → Exercise & Test → Test | `test.resource` | `test` |
| Course → (future) Fast summary | `course.summary.*` | `fast_summary` |
| Class → Roadmap Ghost Res. | `roadmap.resource` | `roadmap_resource` |
| Class → Library | `class.library.*` | `document` / `image` / … |
| Department | `department.handbook` | `handbook` |
| School | `school.equipment.*` | often `document` / `image` |

Host chooses **where** it lands; kind chooses **what** is produced.

---

## 6. Data shape (shared)

Keep ghost core fields; deepen meaning of `resource_kind` and `working_head`:

```text
ghost.resource_kind          # end outcome type (spectrum above)
node.working_head = {
  version, mode,
  contentType,               # exercise_draft | media_asset | summary_draft | …
  draftId? | mediaId? | url? # pointer into the right store
}
submission.output_refs[]     # typed refs for review / attach_output
```

Fulfill adapter registry key: `(host_type, slot_key, resource_kind)` — as §11 already intends.

---

## 7. Delivery strategy (big picture)

Do **not** implement every kind at once. Grow the spectrum:

| Wave | Kinds | Proves |
|------|-------|--------|
| **A** | `image` / `document` / `video` via upload + preview + review | External/simple path + MT Open work |
| **B** | `exercise` (+ `test`) in-app builder + deps | In-product path + hybrid variants — see [13](./13-exercise-ghosts.md) |
| **C** | `roadmap_resource` | Class host + different adapter |
| **D** | `fast_summary` / `course_intro` polish | More composers, same ghost core |
| **E** | department / school kinds | Host-agnostic claim held |

Exercise-first for **in-product** is fine; Wave A in parallel (or just before) keeps “simple file ghosts” honest so not everything looks like an exercise.

---

## 8. What managers / assignees experience (any kind)

1. Open empty slot on a host → ghost create with **correct kind**.
2. Optionally add Chain dependencies (people + part types).
3. Assignees see My work / MT row → **Open work** → correct surface.
4. Submit → reviewer opens **same** work (preview or builder read-only) → approve / decline.
5. Fulfill → students see L3 only.

That loop is identical for a PDF ghost and a 20-question exercise ghost; only the middle surface changes.

---

## 9. Non-goals

- One mega-editor for all kinds.
- Encoding every future kind into Mongo enums on day one (string kinds + registry is enough).
- Forking `course_ghost` / `roadmap_ghost` packages.
- Using Management Table cells as the content editor.

---

## 10. Acceptance (platform-level)

| ID | Check |
|----|--------|
| GK-01 | Creating from different hosts/slots sets different `resourceKind` defaults |
| GK-02 | Open work routes by kind (upload vs builder), not one generic dump |
| GK-03 | Simple image ghost can be dependency of an exercise ghost |
| GK-04 | Roadmap / summary / exercise share drawer + Chain + MT; only surfaces/adapters differ |
| GK-05 | Adding a new kind does not change ghost graph collections |

---

## 11. Doc map

| Doc | Role |
|-----|------|
| [11 — Ghost Resources](./11-ghost-resources.md) | Core domain, graph, MT, API |
| **12 — Resource kinds (this)** | Spectrum, catalog, work surfaces, waves |
| [13 — Exercise Ghosts](./13-exercise-ghosts.md) | First big in-product specialization + build phases |
| [14 — Exercise creation workspace](./14-exercise-creation-workspace.md) | Figma UI source of truth — build this before ghost Open work |
