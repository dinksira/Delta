# School, organization, and membership architecture

This document describes how **users**, **organizations (tenants)**, and **schools** relate in Delta Labs, how **authorization** is scoped, what is implemented today, and how the model evolves toward **school-level** membership (join as student/teacher, multiple roles across schools).

---

## 1. Concepts

| Concept | Purpose |
|--------|---------|
| **User** | Global identity (authentication, profile). |
| **Organization** | **Tenant boundary**: billing, policy, and org-wide administration. It is often **implementation detail**—users can “create a school” without seeing “org” in the UI. |
| **School** | **Operational unit** for education: staff, students, programs, documents, marketplace, etc. |
| **School membership** | **Per-school** link: `school_memberships` with `role_keys` (creators get **`school_owner`**). Invites / student·teacher roles are still to come; see §2b. |

**Design rule:** The same person can be a **student** in one school and a **teacher** in another by holding **different memberships**, not a single global “student” label.

---

## 2. Current implementation (Phase A)

### 2.1 Create school as one product action

**Endpoint:** `POST /v1/schools` (authenticated).

**Behavior:**

- **`targetOrgId` omitted (default):** If the user already has an org where they are **`org_owner`**, the new school is created **in that same org** (multiple self-created schools share one tenant). If they have **no** owner org yet, the API creates **one** workspace org, makes them **`org_owner`**, then creates the school. There is **no** separate user-facing “create organization” step; orgs come from **school creation**, **membership on someone else’s school/org**, or future **invite/offer** flows.
- **`targetOrgId` set:** The school is created **inside that org**; the user must have **`school:manage`** on that org (e.g. org admin / school admin / owner).

This preserves the existing org-scoped storage and permissions while hiding org creation from the default path.

**Legacy endpoint (unchanged):** `POST /v1/orgs/{org_id}/schools` still requires **`school:manage`** on `{org_id}`.

### 2.2 Frontend: create page

- **Submit** calls `createSchoolForMe` → `POST /v1/schools` without `targetOrgId` (backend attaches the school to the user’s primary owner org or creates one on first school).
- **Document file upload** before any org exists (first school): disabled in the wizard; **URL** still works. After the first school is saved, org membership exists and uploads can be enabled on a later screen or pass.
- If the user **only** belongs to another org as a non-owner (e.g. student), the backend still creates a **new** owner org for their first self-serve school (separate tenant from the org they joined).

### 2.3 Authorization today

- **Org-scoped** role bindings (`org_owner`, `org_admin`, `school_admin`, `student`, …) are defined in the authorization service’s role catalog.
- **Create school** under `/v1/orgs/{org_id}/schools` requires **`school:manage`**.
- **Create school** under `/v1/schools` with **`targetOrgId` omitted** reuses the user’s first **`org_owner`** org if any; otherwise creates one workspace org and assigns **`org_owner`**.

---

## 3. Target model (Phase B–D)

### 3.1 School-scoped roles

Move day-to-day permissions to **membership in a school**:

- Tables/collections such as `school_memberships` (names may vary): `user_id`, `school_id`, `roles[]`, `status`.
- **Join school** flows (invite, code, link) create or update **school membership**, not only org-level `join_org` + generic `student`.

### 3.2 Org vs school responsibilities

| Concern | Org | School |
|--------|-----|--------|
| Subscription / billing | Yes | Indirect |
| “Who owns this tenant” | Yes | Operational ownership via membership |
| Teaching, grading, enrollment | No (by default) | Yes |

### 3.3 APIs (illustrative)

- `GET /v1/me/schools` — schools the current user belongs to, with **role per school**.
- `POST /v1/schools/{schoolId}/invitations` — admins invite by email/role.
- `POST /v1/schools/join` — redeem code / token.

---

## 2b. Phase B (implemented): school memberships + `GET /v1/me/schools`

### Data

- Collection **`school_memberships`**: `user_id`, `school_id`, `org_id`, `role_keys` (e.g. `school_owner`), `status` (`active`), timestamps. Unique on `(user_id, school_id)`.

### Behavior

- On **every** successful `create_school`, the creator receives an **`school_owner`** membership row.
- **`GET /v1/me/schools`** returns all **active** memberships for the user, with school summary fields and `roleKeys`. Schools created **before** this feature are **backfilled** on first read (creator → `school_owner`).

### Frontend

- **`fetchMySchools()`** → `GET /v1/me/schools`, query key `schoolQueryKeys.mySchools()`.
- Create-school success **invalidates** `mySchools` alongside org/school lists.

**This phase (My School, marketplace, offers, archive)** uses `fetchMySchools` + `useSchoolActiveOrgId` in the app shell — not invites or join-by-code.

---

## 4. Security notes

- Every query that returns school data must be constrained by **membership** or **org policy**, not by client-supplied ids alone.
- **Audit** role and membership changes (append-only events).
- Prefer **idempotency keys** on create flows to avoid duplicate schools/orgs on double-submit.

---

## 5. Related docs

- Class/school **students & parents** rosters (MT bootstrap, pickers, flows): [`docs/school-page/README.md`](../../docs/school-page/README.md) (overview) and [`docs/school-roster-page/README.md`](../../docs/school-roster-page/README.md) (developer detail)
- Marketplace phases: `school-marketplace-phased-plan.md` (if present in this repo).

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-04-15 | Phase A: `POST /v1/schools`, frontend `createSchoolForMe`, workspace provisioning for zero-org users, architecture doc added. |
| 2026-04-15 | Phase B: `school_memberships`, creator `school_owner` on create, `GET /v1/me/schools`, `fetchMySchools` + query invalidation. |
| 2026-04-15 | My School / Archive use membership list; `useSchoolActiveOrgId` for marketplace & offers; marketplace listing uses selected school’s `orgId`. |
| 2026-04-15 | Policy: no standalone org provisioning in create flow; `POST /v1/schools` reuses first `org_owner` org; document file upload gated until org exists. |
