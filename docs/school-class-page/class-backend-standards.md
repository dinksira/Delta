# Class — backend standards

**Audience:** Backend feature developers  
**Code roots:** `deltalabs-backend/app/api/v1/schools.py`, `app/domain/school/`, `app/domain/management_table/`  
**Related:** [class-how-it-works.md](./class-how-it-works.md) · [class-frontend-standards.md](./class-frontend-standards.md)

---

## Layering

```
api/v1/schools.py          → thin routes (deps + call service)
domain/school/service.py   → class sessions, roadmap, attendance, enrollments
domain/school/repository.py→ Mongo for school/class collections
domain/management_table/*  → bootstrap + rows for class tables
api/deps.py                → session auth (Bearer → user_sessions)
api/deps_authz.py          → org membership + school:manage
```

**Rule:** No business logic in routers. Always validate the workspace item is `type == "class"` before class operations (`_require_class_workspace_item`).

---

## URL prefix

All class APIs:

```
/v1/orgs/{org_id}/schools/{school_id}/classes/{class_workspace_item_id}/...
```

Alternate bootstrap paths under:

```
/v1/orgs/{org_id}/schools/{school_id}/workspace/items/{item_id}/...-table/bootstrap
```

Both must enforce class type when used for class tables.

---

## Auth gates

| Operation | Dependency |
|-----------|------------|
| GET sessions, roadmap, attendance, enrollments, table reads | `require_org_membership` |
| POST/PATCH/DELETE sessions, attendance mutations, enrollments, table bootstraps | `require_org_permission("school:manage", scope_type="org")` |
| Generic MT definition/row CRUD | `school:manage` with `scope_type="school"`, `scope_id_param="school_id"` |
| POST leave-requests/submit | Org membership; **service** checks student of class |

Do not gate class APIs on `school_memberships` alone.

---

## Collections

| Collection | Purpose |
|------------|---------|
| `school_workspace_items` | Class node + `metadata` pointers |
| `school_class_sessions` | Sessions |
| `school_class_roadmaps` | One roadmap doc per class |
| `school_class_attendance` | One attendance overlay per class |
| `class_enrollments` | Enrollment rows |
| `school_management_table_definitions` | Column schemas |
| `school_management_table_instances` | Instances (`table_kind`, `workspace_item_id`) |
| `school_management_table_rows` | Cell data |
| `school_memberships` | School roles (updated on enroll, not on class row patch) |

### Class metadata keys (write on bootstrap)

`studentsTableInstanceId`, `studentsTableDefinitionId`, `studentsTableStudentColumnId`,  
`parentsTableInstanceId` (+ definition / column ids),  
`teachersTableInstanceId` (+ …),  
`gradesTableInstanceId` (+ …),  
`schedulesTableInstanceId` (+ …),  
`assignmentsTableInstanceId` (+ …),  
`leaveRequestsTableInstanceId` (+ …),  
`studentCount`

New class-bound tables must follow the same pointer pattern and set `table_kind` on the instance.

---

## Bootstrap standard

Every class table bootstrap must:

1. Load item; fail if not `type == "class"`.  
2. If metadata instance id exists and instance/`table_kind` valid → return bundle with `alreadyLinked: true`.  
3. Else create definition (starter columns) → instance (`workspace_item_id` = class id) → patch metadata → `alreadyLinked: false`.  
4. Be **idempotent**.

Starter columns and kinds live in `management_table` service/schemas — do not invent column types outside allowed set without updating both BE and FE.

---

## Enrollment standard

`POST …/enrollments`:

1. Resolve user by `userId` or email.  
2. Upsert `school_memberships` with `student`.  
3. Create/reactivate `class_enrollments`.  
4. Sync students-table row if students table bootstrapped (`sync_class_enrollment_row`).  
5. Update `metadata.studentCount`.

Withdraw sets `status: withdrawn` and re-syncs count; **does not** delete the students-table row.

**Important:** Patching a row on a **class** students table does **not** run school membership sync. Membership sync from rows applies to school-level `student` / `parent` / `staff` holders only.

---

## Coding conventions

### Service

- Guard with `_require_class_workspace_item`.  
- Raise `core.exceptions` (`NotFoundError`, `ValidationError`, `PermissionDeniedError`).  
- Map docs with `_map_*` helpers for public schemas.  
- Call `await service.bootstrap()` / ensure indexes from route once as today.

### Repository

- Always query with `org_id` + `school_id` (+ class id) for isolation.  
- Keep indexes in `ensure_indexes` for new class collections/fields.

### Schemas

- Pydantic models in `school/schemas.py` or `management_table/schemas.py`.  
- Prefer camelCase aliases for API JSON (`serialization_alias`).

### Routes

- Thin: construct service, `bootstrap()`, call one method, return `response_model`.  
- Wire `School Service` + `ManagementTableService` in the handler only when orchestrating (e.g. enroll + row sync).

### Cross-domain

- Class sessions/roadmap/attendance → `school` domain.  
- Grids → `management_table` domain.  
- Do not duplicate Mongo access for MT inside `school/repository` if MT repository already owns it.

---

## Endpoint map (class)

| Area | Methods | Path suffix |
|------|---------|-------------|
| Sessions | GET/POST | `/classes/{id}/sessions` |
| Session | PATCH/DELETE | `/classes/{id}/sessions/{session_id}` |
| Roadmap | GET/PUT | `/classes/{id}/roadmap` |
| Roadmap resources | GET | `/classes/{id}/roadmap/resources` |
| Attendance | GET + POST/PATCH/PUT subpaths | `/classes/{id}/attendance…` |
| Enrollments | GET/POST/DELETE | `/classes/{id}/enrollments…` |
| Table bootstraps | POST | `/classes/{id}/{students\|parents\|…}-table/bootstrap` |
| Leave submit | POST | `/classes/{id}/leave-requests/submit` |

---

## Adding a new class-backed table (checklist)

1. Add `table_kind` constant in management_table schemas.  
2. Implement `bootstrap_class_*_table` (idempotent + metadata keys).  
3. Expose POST bootstrap on `schools.py` (class + workspace item paths if needed).  
4. Decide starter columns; person columns use person cell shape `{ userId, fullName, email, username }`.  
5. Document metadata keys in this file and FE meta helpers.  
6. Add unit coverage for bootstrap idempotency and type guard.

---

## Do not

- Skip `_require_class_workspace_item` on new class routes.  
- Use JWT assumptions — auth is **session Bearer** via `deps.py`.  
- Treat `school_memberships` as the API permission system.  
- Store class grid data only on the workspace item document — use MT rows.  
- Break bootstrap idempotency (always safe to call twice).
