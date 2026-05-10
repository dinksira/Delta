# (AU Page) AuthZ design — Org-based RBAC (architecture diagram)

This document explains **why Authorization (AuthZ) is org-based** in Delta Labs and how the RBAC model is designed **in the implemented code**.

Evidence (source of truth):

- AuthZ engine: `deltalabs-backend/app/domain/authorization/service.py`
- AuthZ types: `deltalabs-backend/app/domain/authorization/schemas.py`

---

## Why “org” is the AuthZ boundary (design intent)

- **Organization = tenant boundary**: data, policies, and admin control are scoped by `org_id`.
- **Least privilege gate**: if you are not an **active member** of the org, you are denied before roles/permissions are even evaluated.
- **Role reuse**: org-wide roles (owner/admin) can apply across multiple resources inside the tenant, while still allowing narrower scopes (school/lab/course).

---

## Diagram 1 — Data model (membership → role bindings → permissions)

```mermaid
erDiagram
  USERS ||--o{ ORG_MEMBERSHIPS : "member of"
  ORGS ||--o{ ORG_MEMBERSHIPS : "has"

  USERS ||--o{ ROLE_BINDINGS : "has bindings"
  ORGS ||--o{ ROLE_BINDINGS : "within"
  ROLE_DEFINITIONS ||--o{ ROLE_BINDINGS : "binds"

  ORGS {
    string _id
    string slug
    string name
  }

  USERS {
    string _id
    string username
  }

  ORG_MEMBERSHIPS {
    string org_id
    string user_id
    string status  "active|invited|suspended"
  }

  ROLE_BINDINGS {
    string org_id
    string subject_user_id
    string role_key
    string scope_type  "org|school|lab|course|global"
    string scope_id
  }

  ROLE_DEFINITIONS {
    string role_key
    string[] permissions
  }
```

**How to read it:**

- `org_memberships` answers: **“Is this user allowed to operate in this tenant at all?”**
- `role_bindings` answers: **“Which roles does this user have in this org (and scope)?”**
- `role_definitions` answers: **“What permissions does each role grant?”**

---

## Diagram 2 — Authorization decision flow (what happens per request)

```mermaid
flowchart TD
  R["Request needs permission\n(org_id, permission, scope_type, scope_id)"] --> M["1) Membership gate\norg_memberships must be active"]
  M -->|missing| D1["DENY: missing_org_membership"]
  M -->|present| S["2) Build scope chain\n(scope_type, scope_id)\n+ fallback (org, org_id) if scope_type != org"]
  S --> B["3) Load role_bindings for user in org\nmatching any scope in chain"]
  B --> K["4) Collect role_keys"]
  K --> DEF["5) Load role_definitions for role_keys"]
  DEF --> P["6) Effective permissions = union(def.permissions)"]
  P --> A{"permission in set\nOR '*' in set?"}
  A -->|yes| ALLOW["ALLOW"]
  A -->|no| REL{"Special-case relationship?\nstudent:read_progress + parent/guardian/mentor link"}
  REL -->|yes| ALLOW
  REL -->|no| D2["DENY: permission_missing"]
```

**Key design detail (implemented):** the scope chain includes an **org fallback**, so org-wide roles still apply when evaluating a narrower scope.

---

## Speaker notes (simple explanation)

- “AuthN tells us who you are; AuthZ decides what you can do.”
- “AuthZ is org-based because org is the tenant boundary. We always check membership first.”
- “Then we resolve roles bound to the user within that org, optionally scoped to a specific resource.”
- “Those roles map to permissions via the role catalog, and the engine returns allow/deny.”

