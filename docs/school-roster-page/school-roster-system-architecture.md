# School roster — System architecture (Web + Backend)

## Purpose

System-level architecture for **school-level registration** and **class-level student/parent rosters** using **management tables** (MT), person pickers, and `school_memberships` role sync.

**Scope:** `deltalabs-frontend` + `deltalabs-backend` only.

**Plain-language context:** [school-page/school-overview-user-brief.md](../school-page/school-overview-user-brief.md), [school-page/school-roster-changes-brief.md](../school-page/school-roster-changes-brief.md)

**Related (classified docs in this folder):**

| Doc | Topic |
|-----|--------|
| [school-roster-design-decisions.md](./school-roster-design-decisions.md) | ADRs and product rules |
| [school-roster-user-flows.md](./school-roster-user-flows.md) | Step-by-step user flows |
| [school-roster-backend-design.md](./school-roster-backend-design.md) | API + services |
| [school-roster-backend-data-model-and-diagrams.md](./school-roster-backend-data-model-and-diagrams.md) | Mongo metadata + ER |
| [school-roster-person-picker-design.md](./school-roster-person-picker-design.md) | Picker scopes + search |
| [school-roster-frontend-component-hierarchy.md](./school-roster-frontend-component-hierarchy.md) | Full UI tree |
| [school-roster-frontend-component-hierarchy-simple.md](./school-roster-frontend-component-hierarchy-simple.md) | Layered A–Z summary |

---

## Architecture style

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Roster UI** | Management table (grid + person cells) | Same extensibility as other school MT features; custom columns without new APIs |
| **School registration** | Workspace items `type: student` / `type: parent` | Mirrors folder/class pattern; one holder per registration area |
| **Class assignment** | Class bottom nav → Student / Parent tabs | Separate MT instances per roster type on class metadata |
| **Person search** | Scoped `picker` query param | Prevents admins/teachers from picking wrong population (platform vs school vs class) |
| **Membership** | Sync on **school** MT patch only | Class rosters reference members; they do not create roles |
| **Auth** | `school:manage` for bootstrap + mutate | Same gate as other school workspace mutations |
| **Frontend state** | TanStack Query + metadata on workspace item | Instance ids live on `school_workspace_items.metadata` |

---

## High-level system diagram

```mermaid
flowchart TB
  subgraph Client["Web client"]
    SW["SchoolWorkspaceDetailView<br/>create Student/Parent holders"]
    SDV["SchoolStudentDetailView<br/>SchoolParentDetailView"]
    CDV["SchoolClassDetailView<br/>nav=students | parents"]
    STP["StudentsTablePanel"]
    PTP["ParentsTablePanel"]
    MTG["ManagementTableGroupSection"]
    PCE["ManagementTablePersonCellEditor"]
    API["modules/School/api/index.ts"]
  end

  subgraph APILayer["Backend /v1/orgs/{org_id}/schools/{school_id}"]
    Search["GET /members/search<br/>picker + classWorkspaceItemId"]
    BootS["POST …/students-table/bootstrap"]
    BootP["POST …/parents-table/bootstrap"]
    MTCRUD["Management table routes<br/>definitions, instances, rows"]
  end

  subgraph Domain["Domain services"]
    SchoolSvc["school.service<br/>search_school_members"]
    SchoolRepo["school.repository<br/>picker queries"]
    MTSvc["management_table.service<br/>bootstrap + patch sync"]
  end

  subgraph Stores["MongoDB"]
    WSI["school_workspace_items<br/>metadata: *TableInstanceId"]
    MTDef["school_management_table_definitions"]
    MTInst["school_management_table_instances"]
    MTRow["school_management_table_rows"]
    Mem["school_memberships<br/>role_keys: student | parent"]
    Users["users"]
  end

  SW --> SDV
  SW --> SDV
  CDV --> STP
  CDV --> PTP
  STP --> MTG --> PCE --> API
  PTP --> MTG
  API --> Search
  API --> BootS
  API --> BootP
  API --> MTCRUD

  Search --> SchoolSvc --> SchoolRepo
  BootS --> MTSvc
  BootP --> MTSvc
  MTCRUD --> MTSvc
  SchoolRepo --> Users
  SchoolRepo --> WSI
  SchoolRepo --> MTRow
  MTSvc --> WSI
  MTSvc --> MTDef
  MTSvc --> MTInst
  MTSvc --> MTRow
  MTSvc --> Mem
```

---

## Two-layer model

```mermaid
flowchart LR
  subgraph School["School layer"]
    SR["Student registration workspace"]
    PR["Parent registration workspace"]
  end

  subgraph Class["Class layer"]
    CS["Student tab MT"]
    CP["Parent tab MT"]
  end

  SR -->|"platform picker → student role"| Mem[(school_memberships)]
  PR -->|"platform picker → parent role"| Mem
  CS -->|"school_students picker"| Mem
  CP -->|"school_parents + class_students"| Mem
  CS -.->|"class_students reads rows"| CP
```

---

## Read path: open class Parent tab

```mermaid
sequenceDiagram
  participant U as Manager
  participant V as SchoolClassDetailView
  participant P as ParentsTablePanel
  participant Q as React Query
  participant B as POST parents-table/bootstrap
  participant G as GET MT bundle + rows
  participant M as MongoDB

  U->>V: nav=parents
  V->>P: classMetadata
  P->>Q: read parentsTableInstanceId
  alt no instance or invalid Parent column
    P->>B: bootstrap
    B->>M: create definition + instance, update metadata
  end
  P->>G: fetch bundle + rows
  G->>M: MT docs
  G-->>P: Parent + Student columns
```

---

## Write path: assign parent in class row

```mermaid
sequenceDiagram
  participant U as Manager
  participant E as PersonCellEditor
  participant S as GET /members/search
  participant R as PATCH row cells
  participant M as MongoDB

  U->>E: Open Parent cell
  E->>S: picker=school_parents, q=…
  S->>M: school_memberships + users
  S-->>E: results
  U->>E: Pick parent
  E->>R: patch Parent column
  R->>M: update row cells
  Note over R,M: No membership sync (class scope)
```

---

## Implemented vs not implemented

| Area | Status |
|------|--------|
| Class students MT + `school_students` picker | **Implemented** |
| School student registration + membership sync | **Implemented** |
| Class parents MT (Parent + Student columns) | **Implemented** |
| School parent registration + membership sync | **Implemented** |
| `class_students` picker (Student column on parent tab) | **Implemented** |
| Parents table bootstrap repair | **Implemented** |
| Legacy class enrollment API as primary UI | **Not used** (MT is primary) |
| Server-side validation parent row student ∈ class | **Not implemented** (picker scope only) |
| Parent portal / parent-facing app | **Not implemented** |
| School-level parent–child link (outside class) | **Not implemented** |

---

*Last updated: 2026-06-03*
