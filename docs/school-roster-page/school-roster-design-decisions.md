# School roster — Design decisions

## Purpose

Recorded **architecture and product decisions** for school/class student and parent rosters. Use when extending pickers, adding validation, or building parent portal features.

**Scope:** Backend + web frontend.

---

## Decision index

| ID | Decision | Status |
|----|----------|--------|
| R-01 | Two-layer flow: school register → class assign | Accepted |
| R-02 | Management tables, not dedicated enrollment forms | Accepted |
| R-03 | Separate MT instance per roster type on class metadata | Accepted |
| R-04 | Four person picker scopes | Accepted |
| R-05 | Default bootstrap columns by context | Accepted |
| R-06 | Per-column picker resolution on frontend | Accepted |
| R-07 | Membership sync on school workspace patch only | Accepted |
| R-08 | `school:manage` for bootstrap and mutate | Accepted |
| R-09 | Class parent Student column uses `class_students` only | Accepted |
| R-10 | Parents bootstrap repair / anti-aliasing with students table | Accepted |

---

## R-01 — Two-layer flow (school first, class second)

**Context:** Admins were confused when class Parent tab looked like Student tab and allowed any user search.

**Decision:**

1. **School** — Register students and parents (holder workspaces).
2. **Class → Student tab** — Assign school students to the class.
3. **Class → Parent tab** — Link school parents to students **on this class**.

**Consequence:** Empty pickers show actionable copy (“Register in school parent workspace first”, “Add students on Student tab first”).

---

## R-02 — Management tables over enrollment UI

**Context:** Class enrollment API exists (`POST …/enrollments`).

**Decision:** Primary UX is **management table** bootstrapped per workspace item, with person columns and optional custom fields.

**Rationale:** Aligns with school MT elsewhere; avoids one-off forms per roster type.

**Consequence:** Enrollment API may stay for integrations; web UI uses MT paths.

---

## R-03 — Separate MT instances per roster type

**Context:** Early class Parent tab showed a **Student** column because `parentsTableInstanceId` pointed at the students table instance.

**Decision:**

- `studentsTableInstanceId` — class student roster only.
- `parentsTableInstanceId` — class parent roster only.
- Never reuse the same instance id for both.

**Enforcement:** Bootstrap rejects reuse when `parentsTableInstanceId === studentsTableInstanceId`; frontend re-bootstraps if loaded definition lacks a **Parent** column.

---

## R-04 — Person picker scopes

**Decision:** Search is never “all users” except **`platform`** on school registration workspaces.

| Picker | Population |
|--------|------------|
| `platform` | All Delta Labs users (partial text match) |
| `school_students` | Active `student` on `school_memberships` |
| `school_parents` | Active `parent` on `school_memberships` |
| `class_students` | Users in **this class’s** students MT Student column |

**Consequence:** API accepts optional `classWorkspaceItemId` when `picker=class_students`.

---

## R-05 — Default bootstrap columns

| Context | Columns created |
|---------|-----------------|
| Class → Student tab | **Student** (person) |
| Class → Parent tab | **Parent** (person), **Student** (person) |
| School → Student holder | **Student** (person) |
| School → Parent holder | **Parent** (person) |

**Decision:** Primary column name matches roster type (same pattern as student tab).

---

## R-06 — Per-column picker resolution (frontend)

**Context:** Class parent table has two person columns with different search populations.

**Decision:** `resolvePersonPickerForColumn(column, tableDefault)`:

- Title **Parent** → `school_parents` (or `platform` if table is school registration).
- Title **Student** → `class_students` when `tableDefault === school_parents`; else `school_students` or `platform`.

**Location:** `managementTablePersonCell.ts`

---

## R-07 — Membership sync on school patch only

**Decision:**

| Workspace item type | On row patch |
|---------------------|--------------|
| `student` | Upsert `student` on `school_memberships` from Student column |
| `parent` | Upsert `parent` on `school_memberships` from Parent column |
| `class` | **No sync** — reference only |

**Rationale:** Class rosters assign already-registered members; registration happens at school layer.

---

## R-08 — Permissions

**Decision:** Bootstrap roster tables and patch rows require **`school:manage`** on the org (same as workspace item create/delete).

---

## R-09 — Class parent Student column scoped to class roster

**Decision:** On class Parent tab, Student column search uses **`class_students`**, not `school_students`.

**Rationale:** Parent rows should link to students **in this class**, not every school student.

**Implementation:** Backend reads class `studentsTableInstanceId` + rows; frontend passes `classWorkspaceItemId` on search.

---

## R-10 — Parents bootstrap repair

**Decision:** When bootstrapping parents table, reuse existing instance only if:

1. `parentsTableInstanceId ≠ studentsTableInstanceId`, and  
2. Definition contains a **Parent** column.

Otherwise create a new parents table and update metadata.

---

## Open questions (future ADRs)

| Topic | Options |
|-------|---------|
| Server validate parent row student ∈ class | Patch-time check vs trust picker |
| School-level parent–child graph | Separate collection vs MT only at class |
| Parent invite flow | Email invite vs platform search only |
| Multiple parents per student | Multiple rows (current) vs nested columns |

---

*Last updated: 2026-06-03*
