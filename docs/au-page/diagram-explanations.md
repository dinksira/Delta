# (AU Page) Diagram explanations (presentation-ready)

Use this as **slide text + speaker notes** when presenting the AU (Authentication) architecture.

Scope: **only what is implemented in the repo today**, with explicit callouts for what is not wired yet.

---

## Slide 1 — System flow (end‑to‑end architecture)

### Slide text (keep it short)

- AU UI runs in the **client (untrusted)** and calls backend via `apiClient.ts`
- Backend `/v1/auth/*` is the **trusted enforcement boundary**
- **MongoDB** stores users/sessions/RBAC; **Redis** stores OTP/signup/recover state with **TTL + throttles**
- Middleware uses `AUTH_SESSION_COOKIE=1` as a **presence marker** (not a credential)

### Speaker notes (45–60 seconds)

- This diagram is about **trust boundaries**: browser is untrusted; backend enforces auth validity and permissions.
- AU UI can appear as **pages** (`/login`, `/signup`) or as a **modal** via `AuthModalGateway` on `/?auth=...`.
- On successful login/signup, `AuthSessionProvider` stores the session payload in localStorage (`dl.auth.session.v1`) and sets `AUTH_SESSION_COOKIE=1`.
- `apiClient.ts` attaches `Authorization: Bearer <access_token>` to API requests.
- `middleware.ts` checks only the cookie marker and redirects unauthenticated users to `/?auth=login&next=...`.
- Backend stores durable data in MongoDB and uses Redis only for short-lived OTP/signup/recover state.
- OTP providers (SMS/email) are marked **NOT wired**: we have OTP state + throttles, but no delivery integration yet.

---

## Slide 2 — Backend design (service decomposition)

### Slide text (keep it short)

- `/v1/auth/*` routes delegate to **Identity services** (login/signup/session/logout + OTP + recover)
- Password hashing: **scrypt + salt** (`core.security`)
- Session tokens: issued as opaque tokens; only **SHA‑256 hash stored** in Mongo (`user_sessions.token_hash`)
- AuthZ is separate: **org membership + RBAC** roles→permissions
- SMS/email OTP delivery is **not wired yet**

### Speaker notes (45–60 seconds)

- This diagram maps to real code modules/classes:
  - `identity.service.Service` handles signup/login/session/logout.
  - `SignupFlowService` coordinates multi-step signup with Redis TTL state.
  - `VerificationService` handles OTP state, attempt limits, resend cooldown, and IP throttling (Redis).
  - `RecoverService` implements recover→verify→reset with anti-enumeration and session revocation.
- Security primitives are centralized in `core.security`:
  - Passwords stored using **scrypt**.
  - Sessions store only **hashed** tokens server-side.
- Authorization is a separate engine (`authorization.service.Service`) which checks active org membership and RBAC bindings/definitions.

---

## Slide 3 — Frontend integration & optimization

### Slide text (keep it short)

- AU entry points:
  - **Pages**: `/login`, `/signup`
  - **Modal**: `/?auth=login|signup|recover` via `AuthModalGateway`
- Reusable AU kit: `AuthModalShell` + shared fields/buttons/banners
- Single integration chain: `useAuthMutations.ts` → `authApi.ts` → `apiClient.ts`
- `AuthSessionProvider` centralizes persistence + cookie marker + token getter

### Speaker notes (45–60 seconds)

- The views are composed in:
  - `LoginPageView.tsx`, `SignupPageView.tsx`, `RecoverPageView.tsx`
- Reuse is intentional:
  - Layout + navigation is standardized in `AuthModalShell.tsx`.
  - Inputs are standardized through shared field components (`AuthTextField`, `AuthPasswordField`, `AuthOtpField`, etc.).
- Optimization choices that are implemented:
  - Session hydration before paint (reduces “logged-out flash”).
  - One place to attach bearer tokens (`apiClient.ts`) prevents inconsistent auth headers.
  - Middleware redirect is fast and consistent for protected routes.
- Known gaps are not claimed as implemented:
  - No global frontend logout action wired to `POST /v1/auth/logout`.
  - No default “boot revalidation” using `GET /v1/auth/session` (currently hydrates from storage).

