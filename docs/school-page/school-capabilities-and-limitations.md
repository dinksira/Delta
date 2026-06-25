# School capabilities and limitations

## Purpose

Single reference for **what the school product can and cannot do today**, especially workspace structure, classes, management tables, and student/parent rosters.

**Audience:** Product, school admins, developers, support.

---

## Legend

| Label | Meaning |
|-------|---------|
| **Implemented** | Shipped on web (+/- mobile); usable end-to-end |
| **Partial** | UI or API exists; incomplete or manager-only |
| **Not implemented** | Not available; do not promise to users |

---

## 1. School & organization

| Capability | Status | Notes |
|------------|--------|-------|
| Create school (self-serve) | **Implemented** | `POST /v1/schools`; org created hidden if needed |
| Multiple schools under one owner org | **Implemented** | Reuses first `org_owner` org |
| List my schools | **Implemented** | `GET /v1/me/schools` |
| School owner on create | **Implemented** | `school_memberships` |
| Invite student/teacher by email | **Not implemented** | Platform search registration only |
| Join school by code | **Not implemented** | Planned Phase B–D |
| Parent/student self-admin roster | **Not implemented** | Requires `school:manage` today |

---

## 2. Workspace structure

| Capability | Status | Notes |
|------------|--------|-------|
| Folder nesting | **Implemented** | `type: folder` |
| Department workspace | **Implemented** | Own URL `/department/...` |
| Create class | **Implemented** | Opens class detail + bottom nav |
| Create course | **Implemented** | Workspace item; content UX evolving |
| Create standalone management table | **Implemented** | Template link via MT hub |
| Create student registration holder | **Implemented** | `type: student` |
| Create parent registration holder | **Implemented** | `type: parent` |
| Resource / service / staff items | **Partial** | Types exist; depth varies |

---

## 3. Management tables (generic)

| Capability | Status | Notes |
|------------|--------|-------|
| Column types (text, person, …) | **Implemented** | Shared MT engine |
| Add row / edit cells | **Implemented** | Manager with `school:manage` |
| Add custom columns | **Implemented** | Popover on table |
| Person column with scoped search | **Implemented** | See roster pickers |
| Template picker for new MT | **Implemented** | Standalone MT items |
| Export / import CSV | **Not implemented** | — |
| Row-level permissions | **Not implemented** | Table-level manager gate |

---

## 4. School registration (students & parents)

| Capability | Status | Notes |
|------------|--------|-------|
| School student holder + MT bootstrap | **Implemented** | Default **Student** column |
| School parent holder + MT bootstrap | **Implemented** | Default **Parent** column |
| Platform-wide user search | **Implemented** | `picker=platform` |
| Auto `student` membership on save | **Implemented** | School student holder only |
| Auto `parent` membership on save | **Implemented** | School parent holder only |
| Invite non-user by email | **Not implemented** | User must exist on platform |
| Bulk import students | **Not implemented** | Manual rows |

---

## 5. Class — sessions & navigation

| Capability | Status | Notes |
|------------|--------|-------|
| Class sessions (create, list) | **Implemented** | Virtual / in-person / hybrid |
| Session live room route | **Implemented** | Meet-style layout |
| Bottom nav tabs | **Partial** | All tabs visible; not all functional |
| Attendance tab | **Not implemented** | Nav placeholder |
| Teacher tab | **Not implemented** | Nav placeholder |
| Schedules tab | **Not implemented** | Nav placeholder |
| Grade tab | **Not implemented** | Nav placeholder |
| Assignment tab | **Not implemented** | Nav placeholder |

---

## 6. Class — student roster

| Capability | Status | Notes |
|------------|--------|-------|
| Student tab MT | **Implemented** | Auto bootstrap |
| Pick school-registered students only | **Implemented** | `school_students` picker |
| Custom columns on class roster | **Implemented** | Same MT add-column |
| Sync membership from class row | **Not implemented** | By design — school layer registers |
| Legacy enrollment API as main UI | **Not used** | MT is primary path |

---

## 7. Class — parent roster

| Capability | Status | Notes |
|------------|--------|-------|
| Parent tab MT | **Implemented** | Separate instance from students table |
| Default **Parent** column | **Implemented** | Repair if missing |
| **Student** column on parent tab | **Implemented** | `class_students` picker only |
| Pick school-registered parents | **Implemented** | `school_parents` picker |
| Multiple parents per student | **Implemented** | Multiple rows |
| Server validate student ∈ class on save | **Not implemented** | Picker enforces UX only |
| School-wide parent–child graph | **Not implemented** | Class MT rows only |
| Parent portal view | **Not implemented** | No parent-facing roster |

---

## 8. Person search UX

| Capability | Status | Notes |
|------------|--------|-------|
| Card-style search results (web) | **Implemented** | Replaced plain divider list |
| Picker-specific empty messages | **Implemented** | Actionable copy |
| Card-style search (mobile) | **Implemented** | Parity with web |
| Search with &lt; 2 characters | **Not implemented** | Minimum length enforced |

---

## 9. Mobile

| Capability | Status | Notes |
|------------|--------|-------|
| Class Student tab | **Implemented** | Bootstrap + picker |
| Class Parent tab | **Implemented** | Bootstrap + picker |
| School student registration | **Partial** | Check current build for parity |
| School parent registration page | **Partial** | May lag web |
| API contract shared with web | **Implemented** | Same backend |

---

## 10. Data repair & migration

| Capability | Status | Notes |
|------------|--------|-------|
| Re-bootstrap if parents table shared students instance | **Implemented** | On manager open Parent tab |
| Re-bootstrap if no Parent column | **Implemented** | Frontend + backend |
| One-click fix for all legacy classes | **Not implemented** | Open Parent tab as manager per class |

---

## 11. Quick “can I…?” FAQ

| Question | Answer |
|----------|--------|
| Can I add a parent directly on the class without school registration? | **No** — register parent at school first; picker will be empty. |
| Can I link a parent to a student not on this class’s Student tab? | **No** in UI — Student column uses class roster only. |
| Can I use one table for both students and parents on a class? | **No** — separate tabs and MT instances by design. |
| Does adding a student to a class make them a school student? | **No** — register at school first; class only assigns. |
| Can a parent log in and see their child’s class? | **Not yet** — no parent portal. |
| Can teachers edit rosters without `school:manage`? | **Not yet** — manager permission required. |
| Can I attach extra fields to rosters? | **Yes** — add columns to the MT. |

---

## Related docs

- [school-overview-user-brief.md](./school-overview-user-brief.md)
- [school-roster-changes-brief.md](./school-roster-changes-brief.md)
- [school-roster-page/school-roster-user-flows.md](../school-roster-page/school-roster-user-flows.md)

---

*Last updated: 2026-06-03*
