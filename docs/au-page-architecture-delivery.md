# (AU Page) Authentication — Architecture & Design Delivery

This is a **delivery-quality** document for the “AU Page (Authentication page)” assignment.  
Scope is **AuthN/AuthZ architecture + design**, not feature UI copy.

Related:

- Stakeholder summary: `docs/auth-one-pager.md`
- Full detail: `docs/auth-overview.md`

---

## 0) Scope and accuracy notes (important)

### In scope (implemented)

- Auth endpoints under **`/v1/auth/*`**: login/session/logout, multi-step signup, OTP verify, recovery.
- Session model: bearer token issued client-side, stored server-side as **hash** with expiry.
- OTP + signup/recover flow state: Redis TTL + attempt limits/cooldowns + throttles.
- AuthZ engine: org membership gate + RBAC roles/permissions (org-scoped).

### Out of scope / not implemented yet (do not claim)

- **Real OTP delivery** via email/SMS provider is **not wired** in this repo today.
- Login brute-force throttling is **not implemented yet** (OTP/recover throttles exist).

---

## 1) System flow diagram (high-level)

See `docs/au-page/system-flow-diagram.md`.

---

## 2) Backend design diagram (AuthN/AuthZ responsibilities)

See `docs/au-page/backend-design-diagram.md`.

---

## 3) Frontend design: component integration + performance/UX

See `docs/au-page/frontend-integration-and-optimization.md`.

---

## 4) Evidence (where to verify)

- Backend auth routes: `deltalabs-backend/app/api/v1/auth.py`
- Backend security primitives: `deltalabs-backend/app/core/security.py`
- OTP service: `deltalabs-backend/app/domain/identity/verification_service.py`
- Recover service: `deltalabs-backend/app/domain/identity/recover_service.py`
- Signup flow: `deltalabs-backend/app/domain/identity/signup_flow_service.py`
- AuthZ engine: `deltalabs-backend/app/domain/authorization/service.py`
- Frontend middleware: `deltalabs-frontend/middleware.ts`
- Frontend session context: `deltalabs-frontend/src/contexts/AuthSession_Context.tsx`
- Frontend API client: `deltalabs-frontend/src/lib/apiClient.ts`

