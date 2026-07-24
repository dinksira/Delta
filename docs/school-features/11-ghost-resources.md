# 11 — Ghost Resources

**Status:** In progress (P0–P5 core shipped: drawer + flow + collab + fulfill + MT ops sync; inbox notify later)  
**Parent:** [School](./01-school.md) · **host-agnostic** (Course is only the first surface)  
**Related:** [Management Table](./03-management-table.md) · [Class roadmap](./10-class-roadmap.md) · [How school connects](../school-page/delta-labs-school-architecture-how-it-connects.md)

This document is the **product model + system architecture + scalability + delivery plan**. Product understanding alone is not enough to build; use §§5–14 for engineering.

---

## 0. One-line

A **Ghost** is a managed work-order for a **missing** asset. Chain links are **directed** production steps toward **one** end resource. Students only ever see the **fulfilled** real resource (L3).

**Critical:** Ghosts are a **school-wide capability**, not a Course feature. We are building the first integrations on Course (intro, exercise) and Class (roadmap Ghost Res.), but the domain, API, drawer, and data model must stay **host-agnostic** so the same ghost can hang off course, class, department, school library, equipment, or any future workspace host.

---

## 1. Product definition

| Term | Meaning |
|------|---------|
| **Ghost** | The one missing end resource being defined (e.g. PPT deck) |
| **Host** | Wherever the ghost lives — any school workspace context (not “course only”) |
| **Property** | Description, requirement attachments, due date, default Same/Branch Base |
| **Chain node** | End resource, dependency link, or variant of a link |
| **Chain edge** | Directed **from → to** flow (upstream produces; downstream consumes) |
| **Variant** | Alternate way to produce a node (Same Base vs Branch Base) |
| **Fulfill** | Promote approved end node → one L3 real resource **on that host** via adapter |
| **Management Table** | Ops mirror (assignees, status, blocked-by) — **not** Property/Chain editor |

### 1.1 Host-agnostic (do not forget)

```text
School
  └── Ghost domain (one)     ← Property / Chain / History / fulfill gate
        ├── HostAdapter: course intro
        ├── HostAdapter: course exercise
        ├── HostAdapter: class roadmap / library
        ├── HostAdapter: department
        └── HostAdapter: … future (equipment, school assets, …)
```

| Rule | Detail |
|------|--------|
| **One ghost domain** | `ghost_resources` — never `course_ghost` as the core package |
| **School-scoped API** | `/orgs/{org}/schools/{school}/ghosts` — filter by `hostType` + `hostId` |
| **Host is metadata** | `host_type` + `host_workspace_item_id` (+ optional `slot_key`) on the instance |
| **Shared UI** | One `GhostDrawer` opened from any surface; hosts only pass context |
| **Course = first consumer** | Current work focuses on course slots; Class roadmap already expects Ghost Res. |
| **Fulfill is pluggable** | Only HostAdapters know course vs class vs department write targets |

**Hosts we will use (now and next)**

| `host_type` | Example surfaces | Example `slot_key` |
|-------------|------------------|--------------------|
| `course` | Intro cover/video, Exercise empty card, Q&A assets later | `courseIntro.videos.intro`, `exercise.banner` |
| `class` | Roadmap Ghost Res., class library, sessions materials | `class.library.ppt`, `roadmap.resource` |
| `department` | Shared curricula, dept assets | `department.handbook` |
| `school` | School-wide assets / inventory | `school.equipment.microscope` |
| *(future)* | Any new workspace item type | Host-defined |

**Course-only mistakes to avoid**

- Naming APIs `/courses/{id}/ghosts` as the **only** path (host filter is fine as convenience; core stays school-level).
- Storing ghosts only in `courseIntro` metadata.
- Building Chain UI inside `CourseExercisePanel` instead of shared `modules/School/ghost/`.
- Hard-coding fulfill to patch course metadata with no adapter interface.

**Two surfaces (never conflate)**

```text
Ghost drawer (Property | Chain | History)  ← define the need + graph (same everywhere)
        │
        ▼
Management Table                          ← assign / track / filter at scale
        │
        ▼
Upstream done → notify/unlock downstream → fulfill → ONE L3 resource on host
```

UI entry points today (stubs only): course exercise empty card; class roadmap *Ghost Res.* tab — same drawer, different `hostType` / `hostId`.

---

## 2. Goals & non-goals

### Goals

- Define missing assets with requirements and due dates **on any school host**.
- Compose multi-step production via a **DAG of directed edges**.
- Collaborate with **Same Base** (shared head) or **Branch Base** (isolated then approve).
- Notify / unlock the **downstream** assignee when an upstream node completes (direction-dependent).
- Promote exactly **one** student-facing resource per fulfilled ghost (unless a link is explicitly also published).
- Scale across many schools, **many host types**, and concurrent assignees without storing ghost graphs in workspace `metadata`.
- Keep domain/UI reusable: new host = new adapter + opener, not a new ghost product.

### Non-goals

- Ghost is **not** a Course-only subsystem (Course is just where we integrate first).
- Chain is not the Management Table.
- Chain links are not automatic multi-publish to Direct View.
- Same Base is not “skip review.”
- Do not embed Property/Chain inside `courseIntro` (or any single host’s) metadata.
- Do not reuse feed engagement Redis streams for school ghost notify (different product).

---

## 3. System architecture

### 3.1 Placement in the school stack

```text
┌─────────────────────────────────────────────────────────────┐
│  Direct View (students)          L3 only                     │
├─────────────────────────────────────────────────────────────┤
│  Ghost drawer FE                 Property / Chain / History  │
│  Management Table FE             Ops mirror rows             │
├─────────────────────────────────────────────────────────────┤
│  API  /orgs/{org}/schools/{school}/ghosts…                   │
├─────────────────────────────────────────────────────────────┤
│  GhostResourcesService                                       │
│    ├── GraphEngine (edges, fulfill gate, unlock)             │
│    ├── Collaboration (same_base / branch_base)               │
│    ├── NotifyPort (downstream alerts)                        │
│    └── HostAdapter registry (fulfill → course/class/…)       │
├─────────────────────────────────────────────────────────────┤
│  Mongo: instances | variants | edges | events                │
│  Media / existing host domains (intro metadata, exercise,…)  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Backend package

Pattern inspiration: thin routes like `course_qa` / `course_exercise`, but the **domain is school-level and host-agnostic** (not nested under a course package).

```text
deltalabs-backend/app/domain/ghost_resources/   # NOT course_ghost /
  __init__.py          # export GhostResourcesService
  schemas.py           # includes HostType enum (course | class | department | school | …)
  repository.py        # Motor collections + ensure_indexes
  service.py           # orchestration — never assumes course
  graph.py             # edge validation, cycle check, fulfill gate
  adapters/
    base.py            # HostAdapter protocol (keyed by host_type + slot_key)
    course_intro.py    # first adapters
    course_exercise.py
    class_resource.py  # next
    department.py      # later
  notify.py            # NotifyPort (P0: events only; P2+: inbox/email)
```

Mount thin handlers on `org_router` in `app/api/v1/schools.py` under **`…/schools/{school}/ghosts`** (not only under `/courses/…`). Optional convenience aliases under a course/class path may forward with `hostType`/`hostId` filled in. Auth: org membership + `school:manage` for mutate/fulfill.

### 3.3 Frontend module

```text
deltalabs-frontend/src/modules/School/ghost/   # shared — NOT under course/ only
  GhostDrawer.tsx              # shell: Property | Chain | History
  GhostPropertyTab.tsx
  GhostChainTab.tsx            # directed graph canvas
  GhostHistoryTab.tsx
  VariantModal.tsx
  hooks/useGhost*.ts           # keyed by schoolId + optional host filter
  api/ghostApi.ts
  context/GhostHostContext.ts  # { hostType, hostId, slotKey? }
  openers/
    openFromCourseExercise.ts  # thin: pass host context → drawer
    openFromCourseIntro.ts
    openFromClassRoadmap.ts
```

Query keys under `schoolQueryKeys.ghosts…` (school-scoped). Host panels only open the shared drawer with context — **do not** fork Property/Chain into `course/` or `roadmap/` feature folders.

### 3.4 Why a separate domain (scalability of the codebase)

| Anti-pattern | Problem | Chosen approach |
|--------------|---------|-----------------|
| Ghost JSON in `workspace_item.metadata` | Unbounded growth, no indexes, hard MT sync | Own collections |
| One collection with embedded full graph | Document size, concurrent edit conflicts | Split: instance / nodes / edges / events |
| Fulfill logic inside every host | Duplication | HostAdapter registry |
| Notify inside HTTP handler only | Lost on crash | Append event + outbox-style notify |

---

## 4. Layers (L1 → L3)

```text
L1  Catalog definition (optional)   reusable template key
L2  Ghost instance + Property       the ONE defined need
L2b Chain nodes + directed edges    production graph
L3  Real resource on host           student-visible outcome
```

**Invariant:** unfinished nodes never appear as live Direct View content.

---

## 5. Domain model

### 5.1 Collections

| Collection | Role | Growth |
|------------|------|--------|
| `school_ghost_instances` | Ghost Property + status + slot | 1 per need |
| `school_ghost_variants` | Chain nodes (end / dependency / variant) | ~3–30 per ghost |
| `school_ghost_chain_edges` | Directed `from → to` | ~2–40 per ghost |
| `school_ghost_events` | Append-only History + notify audit | high write |

IDs: `ghi_…`, `ghv_…`, `ghe_…` (edge), `gev_…` (event).

### 5.2 Instance (`school_ghost_instances`)

| Field | Purpose |
|-------|---------|
| `_id` | `ghi_…` |
| `org_id`, `school_id` | Tenant |
| `host_type` | `course` \| `class` \| `department` \| `school` \| … (extensible) |
| `host_workspace_item_id` | Workspace item (or school id when `host_type=school`) |
| `title`, `description` | Property |
| `requirement_attachments[]` | `{ mediaId, fileName, … }` |
| `implementation_type` | Default `same_base` \| `branch_base` |
| `due_at` | Ghost-level due |
| `resource_kind` | `image` \| `video` \| `document` \| … |
| `slot_key` | Host-local bind target (intro video, class library, etc.) — opaque to core graph |
| `status` | `open` → `in_progress` → `fulfilled` \| `cancelled` |
| `default_variant_id` | End / default node |
| `created_by_user_id`, `visibility` | Access |
| `management_table_refs` | Optional `{ definitionId, instanceId, rowIds[] }` |
| `promoted_resource` | Set on fulfill `{ type, ref, fulfilledAt }` |
| timestamps | Audit |

### 5.3 Nodes (`school_ghost_variants`)

| Field | Purpose |
|-------|---------|
| `_id` | `ghv_…` |
| `ghost_id` | Parent |
| `name` | Display |
| `role` | `end` \| `dependency` \| `variant` |
| `is_default` | Primary end |
| `required` | Blocks fulfill until approved |
| `implementation_type` | Per-node Same/Branch |
| `assignee_user_ids[]` | Owners |
| `working_head` | Draft media/doc refs |
| `available_inputs[]` | Attached upstream outputs (from edges) |
| `status` | Node pipeline |
| `submission` / `review` | Deliverable + decision |
| `sort_order`, timestamps | UI |

### 5.4 Edges (`school_ghost_chain_edges`) — directed flow

| Field | Purpose |
|-------|---------|
| `_id` | `ghe_…` |
| `ghost_id` | Parent |
| `from_variant_id` | Upstream (produces) |
| `to_variant_id` | Downstream (consumes / waits) |
| `on_complete` | flags: `notify`, `unlock`, `attach_output` (default all) |

**On upstream `approved`:**

1. **Notify** assignees on every `to_variant_id` (esp. default end).
2. **Unlock** MT / node blocked state.
3. **Attach** upstream submission refs into downstream `available_inputs[]`.

Direction is authoritative: reverse arrow → reverse wait/notify.

```text
Slide images ──▶ PPT (default)
     FROM              TO
  (done)     →   notify B: “use images”
```

### 5.5 Events (`school_ghost_events`)

Append-only: `created`, `property_updated`, `node_added`, `edge_added`, `assigned`, `submitted`, `reviewed`, `upstream_completed`, `notified_downstream`, `fulfilled`, …

Payload keeps `actorUserId`, `nodeId?`, `edgeId?`, `meta`.

### 5.6 Graph rules (GraphEngine)

| Rule | Enforcement |
|------|-------------|
| DAG only | Reject edge that creates a cycle |
| Same ghost | `from`/`to` must share `ghost_id` |
| Max nodes / edges | Soft limits (e.g. 50 nodes, 100 edges) — see §10 |
| One `end` default | Exactly one `is_default` end for fulfill |
| Fulfill gate | All `required` ancestors of end are `approved` + end approved |

---

## 6. Collaboration: Same Base vs Branch Base

| Mode | Behavior | Scale note |
|------|----------|------------|
| **Same Base** | Shared `working_head`; co-edit; submit shared head | One head doc; optimistic concurrency via `version` / `updatedAt` |
| **Branch Base** | Isolated fork per variant; PR-like submit/review | N heads; approve merges or fulfills from branch |

Ghost Property sets default; each node may override. Rejected branches stay for History; never L3.

---

## 7. Host adapters (fulfill) — how “everywhere” stays clean

Ghost core never imports course-intro specifics. Registry selects adapter by `(host_type, slot_key)` or `resource_kind`.

```text
HostAdapter.canFulfill(ghost) → bool
HostAdapter.fulfill(ghost, endNode) → promoted_resource
HostAdapter.unfulfill?(ghost) → optional rollback (later)
```

| Adapter | `host_type` | Writes |
|---------|-------------|--------|
| `course_intro` | `course` | Patch course workspace metadata + media for `slot_key` |
| `course_exercise` | `course` | Patch exercise fields / banner media |
| `class_library` | `class` | Create/attach class resource |
| `department_asset` | `department` | Dept asset / handbook (later) |
| `school_inventory` | `school` | School-wide inventory item (later) |

Adapters keep host domains dumb about Chain; Ghost owns the gate. **Adding a new place to use ghosts** = register adapter + thin FE opener — no schema fork.

---

## 8. Notifications & Management Table

### 8.1 NotifyPort (phased)

| Phase | Behavior |
|-------|----------|
| **P0** | Write `notified_downstream` event; FE polls History / ghost detail |
| **P1** | In-app school inbox collection (or reuse a future school notifications table) |
| **P2** | Optional email / push via existing infra |

Do **not** couple to feed engagement Redis for this.

### 8.2 Management Table (ops mirror)

MT answers who/when/blocked — and mirrors Property fields for scale. Graph editing stays in the drawer.

| Column | Source |
|--------|--------|
| Item | Ghost title (parent) / variant name (subitem) |
| Kind | `ghost` \| `variant` |
| Description | Ghost Property description (parent row) |
| Requirements | Ghost requirement attachment file names |
| Chain node | Node name (variant rows) |
| Requires | Incomplete upstream via edges |
| Implementation | Ghost / node Same Base vs Branch Base |
| Assignee / Status / Due | Node + instance |
| Open ghost | Deep link → drawer (`ghost:{id}` or `…:variant:{vid}`) |

**Hierarchy (Monday-style):** parent row = ghost; child rows = chain variants nested by edge direction (`from` → `to` nests `to` under `from`). Unlinked variants sit directly under the ghost.

Sync strategy (scalable):

- **Write-through on mutation:** ghost service updates linked MT cells when assign/status/edge-complete changes (preferred for correctness).
- Bootstrap / Open Table re-syncs all ghosts on that host.
- Avoid cron full rebuilds as primary sync.
- Store only `management_table_refs` on the ghost — **row data lives in MT collections** (`parent_row_id` for nesting).

---

## 9. API sketch

```text
# Instance (Property)
POST   /v1/orgs/{org}/schools/{school}/ghosts
GET    …/ghosts?hostType=&hostId=&status=
GET    …/ghosts/{ghostId}                 # includes nodes+edges summary or ?expand=
PATCH  …/ghosts/{ghostId}

# Chain
GET    …/ghosts/{ghostId}/variants
POST   …/ghosts/{ghostId}/variants
PATCH  …/variants/{variantId}
GET    …/ghosts/{ghostId}/edges
POST   …/ghosts/{ghostId}/edges           # { fromVariantId, toVariantId }
DELETE …/edges/{edgeId}
POST   …/variants/{variantId}/submit
POST   …/variants/{variantId}/review      # approve → GraphEngine.downstreamEffects
POST   …/ghosts/{ghostId}/fulfill         # { endVariantId }

# History
GET    …/ghosts/{ghostId}/events?cursor=
```

Permissions: read = org member with school access; mutate Property/Chain/fulfill = `school:manage` (or assignee-scoped submit on own node).

---

## 10. Scalability & performance

### 10.1 Expected load (planning envelope)

| Dimension | MVP | Growth target |
|-----------|-----|----------------|
| Ghosts per school | hundreds | tens of thousands |
| Nodes per ghost | ≤ 20 | hard cap 50 |
| Edges per ghost | ≤ 40 | hard cap 100 |
| Concurrent editors per Same Base head | few | use version checks |
| Event volume | high | cursor pagination; TTL optional on old events |

### 10.2 Indexes (repository `ensure_indexes`)

```text
school_ghost_instances
  { org_id, school_id, host_type, host_workspace_item_id, status }
  { org_id, school_id, due_at }
  { org_id, school_id, created_at }

school_ghost_variants
  { ghost_id, sort_order }
  { ghost_id, status }
  { assignee_user_ids }                 # multikey — “my work”

school_ghost_chain_edges
  { ghost_id }
  { from_variant_id }
  { to_variant_id }
  unique { ghost_id, from_variant_id, to_variant_id }

school_ghost_events
  { ghost_id, created_at }
  { org_id, school_id, created_at }     # school-wide activity (optional)
```

### 10.3 Read/write patterns

| Pattern | Approach |
|---------|----------|
| Drawer open | One instance + nodes + edges by `ghost_id` (3 queries or `$in`) — small docs |
| Host list (roadmap / exercise) | Instances query by host; **no** full graphs |
| My assignments | Multikey on `assignee_user_ids` + status |
| History | Cursor page (`_id` / `created_at`), never full dump |
| Fulfill | Transaction or ordered writes: validate gate → adapter → instance status → event |
| Hot Same Base edits | Patch `working_head` with `If-Match` / `updatedAt` precondition |

### 10.4 Graph complexity controls

- Reject cycles (DFS/Kahn in `graph.py`).
- Soft warn + hard reject over node/edge caps.
- No recursive Mongo `$graphLookup` on hot paths — load edges for one ghost into memory (bounded).

### 10.5 Fan-out on upstream complete

Downstream notify is **O(out-degree)** of the completed node (small). For MT write-through, batch cell updates per ghost. Avoid school-wide broadcasts.

### 10.6 Multi-tenant isolation

Every query includes `org_id` + `school_id`. Adapters verify host workspace item belongs to that school before fulfill.

### 10.7 Future scale levers (not MVP)

- Shard key candidate: `school_id` (or `org_id`) if a single tenant dominates.
- Event archive / TTL after fulfill + N days.
- Read replica for list/History if needed.
- Outbox collection + worker for email/push.

---

## 11. Consistency & failure modes

| Case | Behavior |
|------|----------|
| Approve upstream then crash before notify | Idempotent `downstreamEffects(nodeId)` safe to retry; event dedupe by `(edgeId, fromStatus→approved)` |
| Fulfill when required dep missing | 400; no partial L3 write |
| Adapter fails mid-fulfill | No status flip to `fulfilled`; error event; retry fulfill |
| Duplicate edge | Unique index → 409 |
| Concurrent Same Base writes | Last-write with version conflict → 409 + refetch |
| Delete node with edges | Cascade delete edges or block until edges removed (prefer block) |

---

## 12. Frontend architecture

| Surface | Behavior |
|---------|----------|
| Exercise empty ghost card | Opens Ghost drawer (create) with `hostType=course`, `slot_key=exercise…` |
| Course intro missing slot | Same drawer, intro `slot_key` |
| Class roadmap Ghost Res. | List instances for class host; open drawer |
| Chain tab | Directed canvas; create node; draw from→to; variant modal |
| History tab | Infinite scroll on events |
| Direct View | L3 only; managers may see “ghost open” badge |
| Management Table | Linked board; deep link back to drawer |

Keep Chain editing **only** in the drawer. Host panels stay thin openers.

---

## 13. Security

| Actor | Allowed |
|-------|---------|
| Manager (`school:manage`) | Full Property/Chain, review, fulfill, MT |
| Node assignee | Read ghost; edit own Same Base head or Branch; submit |
| Creator | Edit early Property if policy allows |
| Student / public | No ghost APIs; L3 via host Direct View only |

Validate media attachment ownership on Property requirements and submissions.

---

## 14. Implementation roadmap

### Phase map

| Phase | Deliverable | Exit criteria |
|-------|-------------|-----------------|
| **P0 — Skeleton** | Host-agnostic domain + `HostType`, instances CRUD, shared Property drawer, list by host | Create ghost from course **or** class context; same API |
| **P1 — Chain graph** | Nodes + directed edges, cycle check, caps, Chain tab UI | Draw images → PPT; gate visible in API |
| **P2 — Flow effects** | On approve: notify event, unlock, `available_inputs`; assignee UX | Downstream sees “ready to use” |
| **P3 — Collaboration** | Same Base head versioning; Branch Base fork/submit/review | Two modes work end-to-end |
| **P4 — Fulfill** | HostAdapters (intro + exercise), History UI, fulfill endpoint | Student sees L3; ghost `fulfilled` |
| **P5 — Ops scale** | MT write-through, blocked-by column, my-work query, inbox notify | Managers run delivery from MT |

**Implementation progress (2026-07-23):** P0–**P5** landed — directed flow; Same/Branch fork; HostAdapter fulfill; **Ghost ops Management Table** bootstrap + write-through sync (title, chain node, blocked-by, implementation, assignee, status, due, open key); **my-work** API; drawer / class Ghost Res. open ops board. Inbox/email notify still optional later.

### Suggested build order (engineering)

1. Collections + indexes + schemas  
2. Instance API + Ghost Property tab  
3. Variants + edges API + GraphEngine  
4. Chain tab canvas (MVP: list + connect, polish graph later)  
5. Submit/review + downstream effects  
6. Adapters + fulfill  
7. MT sync + notifications  

### Stub wiring (immediate FE)

| Stub | Today | Target |
|------|-------|--------|
| `CourseExercisePanel` ghost card | Opens create exercise | Opens `GhostDrawer` |
| Roadmap Ghost Res. | Empty copy | `GET ghosts?hostType=class&hostId=` |
| MT “Ghost management” placeholder | String only | Optional bootstrap of ghost ops table |

---

## 15. Decisions log

| ID | Decision | Why |
|----|----------|-----|
| GR-01 | Own domain + 4 collections | Scale, indexes, clear SoT |
| GR-02 | Explicit edge documents | Direction drives notify/unlock |
| GR-03 | HostAdapter fulfill | Hosts stay free of graph logic |
| GR-04 | MT is mirror, not editor | Matches Figma + existing MT product |
| GR-05 | Events first, inbox later | Ship History without full notification product |
| GR-06 | Hard caps on graph size | Keep in-memory graph validation cheap |
| GR-07 | School-scoped REST under `…/ghosts` | Multi-host via `host_type` + `host_id` query |
| GR-08 | Host-agnostic core; Course is first consumer only | Ghosts are used everywhere — class, dept, school, … |

---

## 16. Risks & open questions

| Risk / question | Mitigation / default |
|-----------------|----------------------|
| Live Same Base collab (CRDT) too heavy | MVP: media upload + versioned head; real-time later |
| Who may fulfill? | Default: `school:manage` only |
| Optional upstream variants (pick one of N) | `required=false` siblings; end chooses `available_inputs` |
| Multi-hop notify | Only immediate downstream on approve; fulfill still requires full ancestor gate |
| Mobile parity | Web drawer first; mobile list later |
| Catalog L1 templates | Defer until 2+ hosts share the same ghost shapes |
| Team forgets non-course hosts | GR-08 + §1.1; P0 schemas include `HostType` enum beyond `course` |

---

## 17. Mental models (keep these)

> **Ghost** = the **one** missing end resource — **school-wide**, not Course-only.  
> **Host** = course / class / department / school / … — where the ghost is attached.  
> **Chain** = directed links that flow into that end resource.  
> **Arrow from → to** = when FROM is done, TO’s assignee is notified and can use that output.  
> **Variant** = alternate production of a node (Same Base / Branch Base).  
> **Management Table** = who/when/status + blocked-by — separate from Property/Chain.  
> **Resource** = student-visible L3 after fulfill on that host — still one defined outcome.  
> **Architecture** = one host-agnostic domain + HostAdapters; Course is only the first integration surface.
