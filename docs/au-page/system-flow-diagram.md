# (AU Page) System flow diagram — Task submission

## What the subtask requires

- A **system-level** diagram for the AU (Authentication) page showing:
  - **Frontend entry points** (AU page / modal gateway)
  - **Backend auth boundary** (`/v1/auth/*`)
  - **Session storage & route gating** decisions
  - **Data stores** used by auth (Mongo + Redis)
  - Clear callout of what is **not yet integrated** (real email/SMS delivery)

## Verified implementation (evidence)

- **Frontend uses bearer token header** via `deltalabs-frontend/src/lib/apiClient.ts`.
- **Session stored in localStorage** and a **cookie marker** is set for middleware gating via `deltalabs-frontend/src/contexts/AuthSession_Context.tsx`.
- **Protected-route redirects** are enforced by `deltalabs-frontend/middleware.ts` (cookie marker check).
- **Backend auth endpoints** exist under `deltalabs-backend/app/api/v1/auth.py`.
- **OTP state is Redis-backed** and returns `debug_code` only in `local` via `deltalabs-backend/app/domain/identity/verification_service.py`.

## Diagram (architecture, not user journey)

```mermaid
flowchart LR
  subgraph Client["Client (untrusted) — AU Page"]
    UI["AU UI\nLoginPageView / SignupPageView / RecoverPageView\n(or modal via AuthModalGateway ?auth=...)"]
    APIClient["apiClient.ts\nadds Authorization header\n+ X-Request-Id + error normalization"]
    LS["localStorage key\n\"dl.auth.session.v1\"\n(session payload incl. accessToken)"]
    CK["Cookie marker\nAUTH_SESSION_COOKIE=1\npresence only (no token)"]
  end

  subgraph Edge["Edge / Routing"]
    MW["middleware.ts\nredirects unauthenticated users\nfrom protected routes"]
  end

  subgraph API["Backend (trusted boundary)"]
    AuthAPI["/v1/auth/*\n(identity)\nlogin/signup/session/logout\nOTP + recover orchestration"]
    AuthZ["AuthZ (RBAC)\norg_memberships gate\nrole_bindings + role_definitions → permissions"]
  end

  subgraph Stores["Data stores"]
    Mongo["MongoDB (durable)\nusers + user_sessions\norg_memberships + role_*"]
    Redis["Redis (TTL)\nOTP state + signup flow state + recover state\nthrottles/cooldowns"]
  end

  subgraph Providers["OTP delivery providers (not implemented yet)"]
    SMS["SMS provider\nNOT wired"]
    EMAIL["Email provider\nNOT wired"]
  end

  UI -->|React Query mutations| APIClient
  APIClient -->|Authorization: Bearer <access_token>| AuthAPI
  UI -->|AuthSessionProvider\nestablishSession/clearSession| LS
  UI -->|presence marker only| CK
  MW -->|reads cookie marker| CK
  MW -->|redirects to /?auth=login&next=...| UI

  AuthAPI --> Mongo
  AuthAPI --> Redis
  AuthZ --> Mongo
  AuthAPI -. "future integration"\n(deliver OTP) .-> SMS
  AuthAPI -. "future integration"\n(deliver OTP) .-> EMAIL
```

## Implemented vs not implemented (accuracy)

- **Implemented**: token issuance + hashed sessions in Mongo; OTP state + TTL/throttles in Redis; frontend session persistence + middleware gating.
- **Not implemented**: real SMS/email delivery adapters (OTP is returned as `debug_code` only in `local`).

## Walkthrough (implemented, end-to-end)

1. AU UI is rendered either as **pages** (`/login`, `/signup`) or as a **modal** via `AuthModalGateway` (`/?auth=login|signup|recover`).
2. On successful login/signup, the frontend’s `AuthSessionProvider` stores the session payload in localStorage (`dl.auth.session.v1`) and sets `AUTH_SESSION_COOKIE=1`.
3. The frontend `apiClient.ts` attaches `Authorization: Bearer <accessToken>` to API calls.
4. `middleware.ts` protects app routes by checking the **cookie marker** and redirects unauthenticated users to `/?auth=login&next=...`.
5. Backend `/v1/auth/*` stores durable identity/session data in MongoDB and uses Redis only for short‑lived OTP/signup/recover state (TTL + throttles).

