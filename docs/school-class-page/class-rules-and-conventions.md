# Class — rules and conventions

**Audience:** Product + feature developers  
**Related:** [class-how-it-works.md](./class-how-it-works.md) · [school-access-and-permissions.md](../school-page/school-access-and-permissions.md)

---

## Product rules

### 1. Class is a workspace item, not a separate tenant

- Class always belongs to a **school** (`school_id`) inside an **org** (`org_id`).
- Do not invent a parallel “class membership” system for API auth. API gates stay on **org** RBAC.
- Class-specific belonging for students uses `class_enrollments` and/or the class students management table.

### 2. School registration ≠ class assignment

| Step | Where | Effect |
|------|-------|--------|
| Register student/parent | School student/parent holder | Writes `school_memberships` |
| Assign to class | Class Student / Parent tab | Writes management table **rows** on the class |

Never treat class table rows as the only school registration. Register at school first when adding new people to the platform school roster.

### 3. Management tables are the grid engine

For students, parents, teachers, grades, schedules, assignments, leave requests:

- **Definition** = column schema  
- **Instance** = bound to the class workspace item  
- **Rows** = data  

Class `metadata` only stores IDs pointing at instance/definition/columns.

### 4. Bootstrap before edit

Opening a class tab that needs a table must:

1. Read metadata pointer  
2. If missing and user can manage → bootstrap  
3. Then load instance + rows  

Do not hardcode table data in the frontend.

### 5. Sessions drive attendance and meet

- Attendance sessions are merged from `school_class_sessions`.  
- Starting a session sets status `live` then opens Meet route.  
- Empty attendance should guide the user back to the Class (sessions) tab.

### 6. Roadmap is one document per class

- Full replace on `PUT` (MVP).  
- Sidebar resources are aggregated from real APIs (sessions, courses, assignments, schedules) — no fake placeholders for those sources.

### 7. Permissions

| Role of gate | Rule |
|--------------|------|
| Read class data | Must be org member |
| Mutate class structure / tables / sessions / attendance config | Need `school:manage` (or `*`) |
| `school_memberships` alone | Does **not** grant edit APIs |
| Leave request submit | Org member + student of that class (enrollment or students table) |

Frontend: gate mutate UI with `canMutate`; show clear “requires school:manage” when disabled.

---

## Naming conventions (product + code)

| Concept | Name to use | Avoid |
|---------|-------------|--------|
| Workspace item type | `class` | “classroom”, “group” as type |
| Route param | `classItemId` | `classId` alone when ambiguous with course |
| API path segment | `classes/{class_workspace_item_id}` | Mixing with course IDs |
| Nav query | `?nav=students` | New path segments per tab |
| Table kinds | `students`, `parents`, `teachers`, `grades`, `schedules`, `assignments`, `leave_requests` | Inventing alternate kind strings without backend support |

---

## Do / don't for feature work

### Do

- Pass `orgId`, `schoolId`, `classItemId` through every class API call.  
- Invalidate `workspaceItem` after bootstrap so metadata refreshes.  
- Reuse shared `*TablePanel` with `scope="class"` when school and class share the same grid.  
- Keep routes thin; put orchestration in the view or domain service.  
- Document new metadata keys if you add a new class-bound table.

### Don't

- Put class business rules only in the React component with no backend validation.  
- Sync `school_memberships` from **class** table row edits (that sync is for school `student` / `parent` / `staff` holders only).  
- Use `localStorage` as the source of truth for sessions, grades, or roadmap (roadmap may migrate once; server is canonical).  
- Duplicate bottom-nav destinations inside the Start menu (filter tiles already on the bar).  
- Assume every user with a class students row can call `school:manage` routes.

---

## Built vs not built (nav)

**Built tabs:** `class`, `students`, `parents`, `attendance`, `teacher`, `schedules`, `grade`, `assignment`, `roadmap`

**Coming soon (placeholder):** `assets`, `plans`, `labs`, `rnd`, `transport`, `materials`, …

When adding a new tab: mark it built in `isBuiltClassNavSection`, add panel wiring in `SchoolClassDetailView`, add bootstrap + API if it needs a table.

---

## Consistency with school architecture

Class features must respect the platform stack:

1. **User** — global account  
2. **Org** — tenant + API security  
3. **School** — operational unit  
4. **Workspace item (class)** — content under school  

See [delta-labs-school-architecture-how-it-connects.md](../school-page/delta-labs-school-architecture-how-it-connects.md).
