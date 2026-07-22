# Class — frontend standards

**Audience:** Web feature developers  
**Code root:** `deltalabs-frontend/src/modules/School/`  
**Related:** [class-how-it-works.md](./class-how-it-works.md) · [class-backend-standards.md](./class-backend-standards.md)

---

## Layering

```
app/.../class/[classItemId]/     → thin pages (Suspense + view)
views/SchoolClassDetailView.tsx  → orchestration (queries, nav, canMutate)
class/*                          → chrome + thin panel wrappers
attendance/ · roadmap/           → feature domains used by class
api/ · hooks/                    → HTTP + TanStack Query keys
```

**Rule:** Routes stay thin. Business wiring lives in `SchoolClassDetailView` or domain hooks, not in `page.tsx`.

---

## Routes

| Path | Layout | Component |
|------|--------|-----------|
| `/features/school/[schoolId]/class/[classItemId]` | `(workspace)` + bottom nav | `SchoolClassDetailView` |
| `…/session/[sessionId]` | `(meet)` full viewport | `ClassSessionMeetView` |

Tab switching uses **`?nav=`** (and `?attendanceView=` for attendance). Do not add a new App Router segment per tab unless the experience is full-screen (like Meet).

**Return path:** `?returnTo=` validated by `safeClassReturnHref` — only allow paths under that school.

---

## Component inventory (`modules/School/class/`)

| File | Responsibility |
|------|----------------|
| `ClassWorkspaceRouteLayout.tsx` | Content shell + bottom-nav padding |
| `ClassBottomNav.tsx` | Fixed bar: Start + fixed tabs + swappable slot |
| `ClassStartMenu.tsx` | Overflow grid; filters tiles already on bottom bar |
| `classBottomNavConfig.ts` | `ClassNavId`, labels, icons, `parseClassNavId`, `startMenuTiles` |
| `classNavigation.ts` | Safe return href, attendance view parse |
| `schoolClassPermissions.ts` | `userCanManageSchoolWorkspace` |
| `ClassPageHeader.tsx` | Back + title + utilities |
| `ClassSessionSection.tsx` / `ClassSessionCard.tsx` / empty / modals | Sessions UI |
| `ClassSessionMeetView.tsx` | Meet shell (placeholder media) |
| `Class*TablePanel.tsx` | Thin wrappers → shared domain table panels |
| `ClassAttendancePanel.tsx` | Attendance hub |
| `layoutConstants.ts` | Shared Tailwind tokens for class chrome |
| `index.ts` | Public barrel exports |

Roadmap UI lives under `modules/School/roadmap/` (`ClassRoadmapPanel`).

---

## Coding conventions

### Naming

- Components: `Class*` prefix for class chrome/panels.  
- Page view: `SchoolClassDetailView`.  
- Config/utils: `class*` camelCase files.  
- Props: `Readonly<{ orgId; schoolId; classItemId; … }>`.

### Permissions

```ts
const canMutate = userCanManageSchoolWorkspace(permissions, orgRoleKeys, schoolRoleKeys);
// Pass canMutate into panels; disable mutate actions when false
```

### Table panel pattern

1. Read `*TableInstanceId` from class workspace `metadata`.  
2. If missing and `canMutate` → `useMutation` bootstrap + `useEffect` once.  
3. On success → `onBootstrapped()` (parent invalidates `workspaceItem`) + invalidate MT instance query.  
4. Load bundle with `fetchManagementTableInstanceBundle`.  
5. Guard kind with `useManagementTableKindGuard` when available.  
6. Use `scope="class"` on shared roster panels so pickers/copy match class context.

### Query keys

Use `schoolQueryKeys` only — do not invent ad-hoc keys.

```ts
schoolQueryKeys.workspaceItem(orgId, schoolId, classItemId)
schoolQueryKeys.classSessions(orgId, schoolId, classItemId)
schoolQueryKeys.classAttendance(orgId, schoolId, classItemId)
schoolQueryKeys.classEnrollments(orgId, schoolId, classItemId)
schoolQueryKeys.classRoadmap(orgId, schoolId, classItemId)
schoolQueryKeys.classRoadmapResources(orgId, schoolId, classItemId)
schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId)
schoolQueryKeys.managementTableRows(orgId, schoolId, instanceId, groupId, page)
schoolQueryKeys.orgAccess(userId, orgId)
```

### Navigation

- Bottom nav: `Link` with `prefetch={false}`, preserve `returnTo` when needed.  
- Programmatic: `router.push` / `replace` with `scroll: false`.  
- Start menu: update last-slot in `localStorage` (`deltalabs:class:last-nav:{classItemId}`), then navigate.  
- Filter start-menu tiles already present on the bottom bar via `startMenuTiles()`.

### Layout / styling

- Prefer `CLASS_WORKSPACE_LAYOUT` tokens from `layoutConstants.ts`.  
- Roadmap and Meet get special overflow / full-height treatment — follow existing layout branches.  
- Match existing School design system; do not invent a second visual language for one tab.

### API client

All class HTTP helpers live in `modules/School/api/index.ts` (sessions, attendance, roadmap, enrollments, bootstraps). New class endpoints get a named function there, then a hook or view query — not raw `fetch` inside a panel.

---

## Adding a new class tab (checklist)

1. Add `nav` id to `ClassNavId` + labels/icons in `classBottomNavConfig.ts`.  
2. Mark built in `isBuiltClassNavSection` (or leave coming-soon placeholder).  
3. Wire panel in `SchoolClassDetailView` switch.  
4. If table-backed: add bootstrap API client + metadata readers + `Class*TablePanel` wrapper.  
5. Pass `orgId`, `schoolId`, `classItemId`, `canMutate`, `classMetadata`, `onBootstrapped`.  
6. Invalidate the right `schoolQueryKeys` after mutations.

---

## Do not

- Duplicate domain table logic inside `Class*TablePanel` — keep wrappers thin.  
- Rely on `ClassStudentsSection` enrollment-by-email UI as the main students path (management table is canonical).  
- Store authoritative session/grade data only in `localStorage`.  
- Bypass `canMutate` for bootstrap or row edits.
