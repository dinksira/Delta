# School capabilities and limitations

## Purpose

Single reference for **what the school product can and cannot do today**, especially workspace structure, classes, management tables, and student/parent rosters.

**Audience:** Product, school admins, developers, support.

**Stakeholder handoff (send this):** [school-what-we-have-implemented.md](./school-what-we-have-implemented.md)

---

## Legend

| Label | Meaning |
|-------|---------|
| **Implemented** | Shipped on web (+/- mobile); usable end-to-end |
| **Partial** | UI or API exists; incomplete or shell-only |
| **Not implemented** | Not available; do not promise to users |

---

## 1. School & organization

| Capability | Status | Notes |
|------------|--------|-------|
| Create school (self-serve) | **Implemented** | `POST /v1/schools`; org created if needed |
| Multiple schools under one owner org | **Implemented** | Reuses first `org_owner` org |
| List my schools | **Implemented** | `GET /v1/me/schools` |
| School owner on create | **Implemented** | `school_memberships` |
| Marketplace / offers | **Implemented** | Web |
| Archive school | **Implemented** | — |
| Invite student/teacher by email | **Not implemented** | Platform search registration only |
| Join school by code | **Not implemented** | — |
| Parent/student self-admin roster | **Not implemented** | Requires `school:manage` today |

---

## 2. Workspace structure

| Capability | Status | Notes |
|------------|--------|-------|
| Folder nesting | **Implemented** | `type: folder` |
| Department workspace | **Implemented** | `/department/...` |
| Create class | **Implemented** | Class detail + bottom nav |
| Create course | **Partial** | Item exists; no dedicated course workspace |
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
| Add custom columns | **Implemented** | — |
| Person column with scoped search | **Implemented** | Platform / school / class pickers |
| Template picker for new MT | **Implemented** | Standalone MT items |
| Export / import CSV | **Not implemented** | — |
| Row-level permissions | **Not implemented** | Table-level manager gate |

---

## 4. School registration (students & parents)

| Capability | Status | Notes |
|------------|--------|-------|
| School student holder + MT bootstrap | **Implemented** | Default Student column |
| School parent holder + MT bootstrap | **Implemented** | Default Parent column |
| Platform-wide user search | **Implemented** | `picker=platform` |
| Auto `student` membership on save | **Implemented** | School student holder only |
| Auto `parent` membership on save | **Implemented** | School parent holder only |
| Invite non-user by email | **Not implemented** | User must exist on platform |
| Bulk import students | **Not implemented** | Manual rows |

---

## 5. Class — shell & sessions

| Capability | Status | Notes |
|------------|--------|-------|
| Bottom nav + Start menu | **Implemented** | Built tabs vs coming soon |
| Class sessions (create, list, start) | **Implemented** | Virtual / in-person / hybrid |
| Session live room route | **Partial** | Meet shell; not real A/V |
| Coming soon tabs (assets, labs, …) | **Not implemented** | Placeholders only |

---

## 6. Class — teaching tabs

| Capability | Status | Notes |
|------------|--------|-------|
| Student tab MT | **Implemented** | Auto bootstrap; school student picker |
| Parent tab MT | **Implemented** | Parent + Student columns |
| Teacher tab MT | **Implemented** | Auto bootstrap |
| Attendance (marks, devices, leave) | **Implemented** | Full attendance APIs + UI |
| Schedules tab | **Implemented** | Schedules MT bootstrap |
| Grade tab | **Implemented** | Grades MT bootstrap |
| Assignment tab | **Implemented** | Assignments MT bootstrap |
| Roadmap | **Implemented** | GET/PUT + resources API; see roadmap doc |
| Sync membership from class row | **Not implemented** | By design — school layer registers |
| Parent portal view | **Not implemented** | No parent-facing portal |

---

## 7. Person search UX

| Capability | Status | Notes |
|------------|--------|-------|
| Card-style search results (web) | **Implemented** | — |
| Picker-specific empty messages | **Implemented** | — |
| Card-style search (mobile) | **Implemented** | — |
| Search with &lt; 2 characters | **Not implemented** | Minimum length enforced |

---

## 8. Mobile

| Capability | Status | Notes |
|------------|--------|-------|
| Class sessions, students, parents, teachers, attendance, grades | **Implemented** | Shared API |
| Class: schedules / assignments / roadmap | **Implemented** | Same bootstrap + roadmap APIs as web |
| School student registration | **Implemented** | — |
| School parent registration | **Not implemented** | Lags web |
| Marketplace buy/bid | **Partial** | Listing stronger than buy flow |

---

## FAQ

**Can I register a student only inside a class?**  
Prefer school registration first, then assign in the class Student tab.

**Is Meet a real video product?**  
No — navigable shell with session metadata; A/V is placeholder.

**Is the course item a full course product?**  
No — creatable workspace cards only; no course workspace yet.

---

*Last updated: 2026-07-16*
