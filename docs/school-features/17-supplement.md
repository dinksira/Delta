# 17 — Supplement (School course)

**Status:** Phase 0–1 first slice (upload + Direct View + typed previews)  
**Parent:** [School](./01-school.md)  
**Surfaces:** Course **Supplement** tab

---

## 0. One-line

Course **Supplement** is where managers upload and browse support materials (PDF, slides, video, audio, other, plus Ghost file) with in-app preview.

---

## 1. What shipped (Phase 0–1)

| Piece | Behavior |
|-------|----------|
| Nav | `?nav=supplement` → `CourseSupplementPanel` |
| Direct View | Tabs: PDF / Slides / Video / Audio / Other / Ghost file; search; cards |
| Upload | Modal: name, description, Upload File or Link; media via `uploadSchoolMediaFile` |
| Preview | Dialog: `<video>`, `<audio>`, PDF/slides/other iframe, images |
| Empty | “No Resource Detected” + Upload CTA |
| Ghost | Ghost tile on Ghost file tab → `GhostDrawer` (`document` / `course.supplement.resource`) |
| MT | Score-style catalog (`surface: supplement`), no Ghost Ops |
| API | `GET/POST …/supplements`, `GET/PATCH/DELETE …/supplements/{id}` |

---

## 2. Deferred

- Full fulfill adapter publishing ghost → L3 supplement card
- Office Online / dedicated PPTX renderer (iframe fallback for now)
- Tag editor in upload modal
- Bulk download

---

## 3. Acceptance

| ID | Check |
|----|--------|
| SU-01 | Supplement nav opens panel |
| SU-02 | Upload PDF/video/audio → appears under matching tab |
| SU-03 | Card opens preview for that type |
| SU-04 | Link tab stores external URL and previews/opens |
| SU-05 | Ghost file tab opens ghost workspace tile |
