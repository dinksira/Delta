# School roster — Backend data model and diagrams

## Overview

Roster features persist through:

1. **`school_workspace_items`** — holder nodes + **metadata** pointing at MT instances
2. **Management table collections** — definitions, instances, rows
3. **`school_memberships`** — `role_keys` includes `student` / `parent` after school registration patch
4. **`users`** — person picker search target

No separate `class_parents` or `class_enrollments` collection is required for the MT-based UI (legacy enrollment may still exist).

---

## Entity relationship (logical)

```mermaid
erDiagram
  SCHOOLS ||--o{ SCHOOL_WORKSPACE_ITEMS : "school_id"
  SCHOOL_WORKSPACE_ITEMS ||--o| MT_INSTANCES : "metadata.*TableInstanceId"
  MT_INSTANCES ||--|| MT_DEFINITIONS : "definition_id"
  MT_INSTANCES ||--o{ MT_ROWS : "instance_id"
  USERS ||--o{ SCHOOL_MEMBERSHIPS : "user_id"
  SCHOOLS ||--o{ SCHOOL_MEMBERSHIPS : "school_id"

  SCHOOL_WORKSPACE_ITEMS {
    string _id PK
    string org_id
    string school_id
    string type "class|student|parent|..."
    object metadata
  }

  SCHOOL_WORKSPACE_ITEMS_METADATA {
    string studentsTableInstanceId
    string studentsTableDefinitionId
    string studentsTableStudentColumnId
    string parentsTableInstanceId
    string parentsTableDefinitionId
    string parentsTableParentColumnId
    string parentsTableStudentColumnId
  }

  MT_ROWS {
    string _id PK
    string instance_id FK
    string group_id
    object cells "columnId -> value"
  }

  SCHOOL_MEMBERSHIPS {
    string user_id FK
    string school_id FK
    array role_keys "student|parent|school_owner|..."
    string status "active"
  }
```

---

## Workspace metadata keys

Stored on `school_workspace_items.metadata`:

### Students table

| Key | Type | Purpose |
|-----|------|---------|
| `studentsTableInstanceId` | string | MT instance id |
| `studentsTableDefinitionId` | string | MT definition id |
| `studentsTableStudentColumnId` | string | Person column id; membership sync |

### Parents table

| Key | Type | Purpose |
|-----|------|---------|
| `parentsTableInstanceId` | string | MT instance id |
| `parentsTableDefinitionId` | string | MT definition id |
| `parentsTableParentColumnId` | string | Person column id; membership sync on school `parent` workspace |
| `parentsTableStudentColumnId` | string | Student link column (class parents table only) |

### Example (class item)

```json
{
  "studentsTableInstanceId": "mti_abc…",
  "studentsTableDefinitionId": "mtd_def…",
  "studentsTableStudentColumnId": "mtc_col_student",
  "parentsTableInstanceId": "mti_xyz…",
  "parentsTableDefinitionId": "mtd_parent…",
  "parentsTableParentColumnId": "mtc_col_parent",
  "parentsTableStudentColumnId": "mtc_col_student_link"
}
```

---

## Person cell value shape (in `cells`)

```json
{
  "userId": "usr_…",
  "fullName": "Jane Doe",
  "username": "jane",
  "email": "jane@example.com"
}
```

Backend sync reads `userId` / `user_id`. Display uses `fullName`, `username`, `email`.

---

## Management table collections

| Collection | Roster usage |
|------------|--------------|
| `school_management_table_definitions` | Column schema (Student, Parent, custom fields) |
| `school_management_table_instances` | Linked to workspace via `workspace_item_id` + metadata mirror |
| `school_management_table_rows` | Roster rows; person values in `cells` map |

Default group id: `mtg_main` (`MANAGEMENT_TABLE_DEFAULT_GROUP_ID`).

---

## `school_memberships` role sync

After patch on **school** registration workspace:

```mermaid
flowchart LR
  Patch["PATCH row cells"] --> Type{workspace item type}
  Type -->|student| SC["Read studentsTableStudentColumnId"]
  Type -->|parent| PC["Read parentsTableParentColumnId"]
  SC --> Upsert["upsert_school_membership<br/>append student to role_keys"]
  PC --> Upsert2["upsert_school_membership<br/>append parent to role_keys"]
```

Class workspace patches **do not** write memberships.

---

## `class_students` data read path

```mermaid
flowchart TD
  A["GET /members/search?picker=class_students"] --> B[Load class workspace item]
  B --> C{studentsTableInstanceId?}
  C -->|no| Empty[Return empty items]
  C -->|yes| D[List MT rows for instance]
  D --> E[Extract userIds from Student column cells]
  E --> F[Filter users collection by ids + text query]
  F --> G[Return items]
```

---

## Workspace item types (roster-related)

| type | Purpose |
|------|---------|
| `student` | School student registration holder |
| `parent` | School parent registration holder |
| `class` | Hosts class student + class parent MT metadata |

---

## Indexes (inherited)

Roster code relies on existing school + MT indexes from repository bootstrap (`ensure_indexes`). No roster-specific index additions documented separately.

---

*Last updated: 2026-06-03*
