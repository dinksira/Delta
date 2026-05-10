# Auth (One‑Pager)

**Audience:** stakeholders and reviewers who want the “big picture” of Authentication & Authorization in Delta Labs.

**Detailed version:** see `docs/auth-overview.md`.

---

## 1) What we built (today)

- **Authentication (AuthN)**: login/signup/recover + session issuance via `/v1/auth/*` using **bearer access tokens**.
- **Authorization (AuthZ)**: tenant-scoped permissions using **organization membership** + **RBAC** (roles → permissions).
- **Ephemeral security flows**: OTP + signup/recover state stored in **Redis with TTL + throttles**.

---

## 2) Architecture (trust boundaries + data stores)

```mermaid
flowchart LR
  subgraph Client["Client (untrusted)"]
    FE["Next.js Frontend"]
    LS["localStorage\n(session payload incl. access token)"]
    CK["Cookie marker\nAUTH_SESSION_COOKIE=1\n(no token)"]
  end

  subgraph Edge["Edge / routing"]
    MW["Next.js middleware\nprotects routes"]
  end

  subgraph API["Backend (trusted)"]
    AUTH["Auth API\n/v1/auth/*"]
    AUTHZ["Authorization engine\n(RBAC decisions)"]
  end

  subgraph Stores["Data stores"]
    M["MongoDB\nusers + user_sessions\norg_memberships + role_*"]
    R["Redis (TTL)\nOTP + signup flow + recover\nrate limits / cooldowns"]
  end

  subgraph Providers["External providers (not integrated yet)"]
    SMS["SMS gateway\n(not wired)"]
    EMAIL["Email gateway\n(not wired)"]
  end

  FE --> LS
  FE --> CK
  MW --> FE
  FE --> MW
  FE -->|Authorization: Bearer <token>| AUTH
  AUTH --> M
  AUTH --> R
  AUTHZ --> M
  AUTH -. would deliver OTP .-> SMS
  AUTH -. would deliver OTP .-> EMAIL
```

**Key design decisions**

- **Bearer token in header, not cookies**: reduces classic CSRF exposure (browser won’t auto-attach `Authorization` cross-site).
- **Cookie marker is not a credential**: it only helps middleware do fast redirects; backend security never depends on it.
- **Mongo vs Redis split**: Mongo for durable identity/session/RBAC; Redis for **short-lived** OTP + flow state with TTL and throttles.

---

## 3) Data model (AuthZ is org-scoped)

```mermaid
erDiagram
  USERS ||--o{ USER_SESSIONS : "has"
  ORGS ||--o{ ORG_MEMBERSHIPS : "has"
  USERS ||--o{ ORG_MEMBERSHIPS : "belongs_to"
  ORGS ||--o{ ROLE_BINDINGS : "has"
  USERS ||--o{ ROLE_BINDINGS : "assigned"
  ROLE_DEFINITIONS ||--o{ ROLE_BINDINGS : "binds"

  USERS {
    string _id
    string username_normalized
    string email_normalized
    string phone_e164
    string password_hash
  }

  USER_SESSIONS {
    string _id
    string user_id
    string token_hash
    datetime expires_at
    datetime revoked_at
  }

  ORGS {
    string _id
    string slug
    string name
  }

  ORG_MEMBERSHIPS {
    string org_id
    string user_id
    string status
  }

  ROLE_DEFINITIONS {
    string role_key
    string[] permissions
    int membership_rank
  }

  ROLE_BINDINGS {
    string org_id
    string subject_user_id
    string role_key
    string scope_type
    string scope_id
  }
```

**How AuthZ decisions work (one sentence):** must be an **active org member**, then RBAC roles are resolved into an effective permission set (including `"*"` for full access).

---

## 4) Security posture (what’s implemented vs next)

### Implemented protections (today)

- **Passwords**: hashed with **scrypt** + per-password salt.
- **Sessions**:
  - raw bearer token generated with `secrets`
  - server stores **only `token_hash`** (not raw token)
  - sessions have `expires_at` and are invalid after expiry (TTL cleanup in Mongo is eventual)
- **OTP / recovery**:
  - OTP stored in Redis as **hash**, with TTL
  - resend cooldown + attempt limits + per-IP throttles
  - recovery request uses **anti-enumeration** behavior for unknown identities
  - password reset revokes **all sessions**
- **CSRF**:
  - backend auth uses `Authorization: Bearer …` (not cookie auth)
  - cookie marker is not used as backend credential

### Not implemented yet (important accuracy notes)

- **OTP delivery providers**: no real email/SMS gateway integration is wired in yet (only state + debug code in `local`).
- **Login brute-force throttling**: OTP/recover throttle exists; login should also be rate-limited (recommended next).
- **Central “revalidate session on boot”**: frontend currently hydrates from storage; a `/v1/auth/session` validation step can be added.

---

## 5) Where to verify in the repo

- **Big picture (detailed)**: `docs/auth-overview.md`
- **Backend routes**: `deltalabs-backend/app/api/v1/auth.py`
- **Password/token primitives**: `deltalabs-backend/app/core/security.py`
- **OTP / recover / signup flow**:
  - `deltalabs-backend/app/domain/identity/verification_service.py`
  - `deltalabs-backend/app/domain/identity/recover_service.py`
  - `deltalabs-backend/app/domain/identity/signup_flow_service.py`
- **AuthZ engine (RBAC)**: `deltalabs-backend/app/domain/authorization/service.py`
- **Frontend session provider + middleware**:
  - `deltalabs-frontend/src/contexts/AuthSession_Context.tsx`
  - `deltalabs-frontend/middleware.ts`

