# Auth — implementation analysis & completed-work task list

**Purpose:** Deep analysis of the **Auth / Identity** vertical in **Deltalabs** (`deltalabs-backend` + `deltalabs-frontend`), organized as submission-ready **Task / Subtask** records.  
**Scope:** Items below reflect what is implemented in the repository now.

---

## 1. Executive summary

| Layer | Summary |
|------|---------|
| **Backend** | Full `/v1/auth` API surface for login/signup/session/logout, OTP verification send/verify/resend, resumable multi-step signup flow, and password recover request/verify/reset. Identity persistence uses Mongo with session TTL and optional unique partial indexes for email/phone to avoid null-duplicate collisions. |
| **Frontend** | Real auth API integration in `authApi`, validation for identifier/password/OTP, React Query mutations, multi-step signup UX, login/recover views, modal gateway via URL query (`?auth=`), and session lifecycle via `AuthSessionProvider` with token hookup to `apiClient`. |
| **Quality** | Unit tests exist for signup-flow/verification/recover services, plus route presence checks in OpenAPI tests. |

---

## 2. Backend implemented tasks

### Task B-AUTH-01 — Implement base auth lifecycle endpoints
- **Subtask B-AUTH-01.1:** Implement `POST /v1/auth/signup/init` (direct signup + immediate session issue).
- **Subtask B-AUTH-01.2:** Implement `POST /v1/auth/login` (identity + password authentication).
- **Subtask B-AUTH-01.3:** Implement `GET /v1/auth/session` (resolve active session from bearer token).
- **Subtask B-AUTH-01.4:** Implement `POST /v1/auth/logout` (revoke bearer-token session).
- **Subtask B-AUTH-01.5:** Implement strict bearer extraction helper with uniform 401 payload for missing token.

### Task B-AUTH-02 — Implement identity service (core auth logic)
- **Subtask B-AUTH-02.1:** Enforce password policy during signup operations.
- **Subtask B-AUTH-02.2:** Implement duplicate identity checks across username/email/phone.
- **Subtask B-AUTH-02.3:** Implement password-hash verification for login.
- **Subtask B-AUTH-02.4:** Implement inactive-account rejection guard.
- **Subtask B-AUTH-02.5:** Implement auth response issuance (`access_token`, `session`, `user`).
- **Subtask B-AUTH-02.6:** Implement session token hashing + lookup flow.
- **Subtask B-AUTH-02.7:** Implement logout session revocation.
- **Subtask B-AUTH-02.8:** Implement identity service index bootstrap hook.

### Task B-AUTH-03 — Implement identity repository and data model
- **Subtask B-AUTH-03.1:** Implement users collection unique index on `username_normalized`.
- **Subtask B-AUTH-03.2:** Implement optional unique **partial** index for `email_normalized` (`$type: string`).
- **Subtask B-AUTH-03.3:** Implement optional unique **partial** index for `phone_e164` (`$type: string`).
- **Subtask B-AUTH-03.4:** Implement index migration behavior (drop/recreate index if old partial filter mismatches).
- **Subtask B-AUTH-03.5:** Implement sessions unique index on `token_hash`.
- **Subtask B-AUTH-03.6:** Implement sessions TTL index on `expires_at`.
- **Subtask B-AUTH-03.7:** Implement identity lookup by username/email/phone normalized forms.
- **Subtask B-AUTH-03.8:** Implement create user with password hash and canonical timestamps.
- **Subtask B-AUTH-03.9:** Implement create/find/revoke session operations.
- **Subtask B-AUTH-03.10:** Implement revoke-all-sessions helper per user (used by recover reset).
- **Subtask B-AUTH-03.11:** Implement password hash update operation.

### Task B-AUTH-04 — Implement OTP verification service
- **Subtask B-AUTH-04.1:** Implement `POST /v1/auth/verification/send`.
- **Subtask B-AUTH-04.2:** Implement channel validation (`email` / `sms`).
- **Subtask B-AUTH-04.3:** Implement OTP code issuance + hashed code persistence in Redis.
- **Subtask B-AUTH-04.4:** Implement destination masking in response.
- **Subtask B-AUTH-04.5:** Implement environment-gated debug OTP return in local env.
- **Subtask B-AUTH-04.6:** Implement resend cooldown guard.
- **Subtask B-AUTH-04.7:** Implement verification attempt limits and replay protection.
- **Subtask B-AUTH-04.8:** Implement per-IP OTP request throttling.
- **Subtask B-AUTH-04.9:** Implement `POST /v1/auth/verification/verify`.
- **Subtask B-AUTH-04.10:** Implement `POST /v1/auth/verification/resend`.

### Task B-AUTH-05 — Implement resumable signup flow orchestration
- **Subtask B-AUTH-05.1:** Implement `POST /v1/auth/signup/step/identity` with uniqueness check and flow creation.
- **Subtask B-AUTH-05.2:** Implement Redis-backed flow state persistence with expiry.
- **Subtask B-AUTH-05.3:** Implement `POST /v1/auth/signup/step/contact` requiring email or phone.
- **Subtask B-AUTH-05.4:** Implement contact uniqueness checks for email and phone.
- **Subtask B-AUTH-05.5:** Implement strict step-order validation (`signup_step_order_invalid`).
- **Subtask B-AUTH-05.6:** Implement `POST /v1/auth/signup/step/verification` requiring used OTP state.
- **Subtask B-AUTH-05.7:** Implement destination-to-contact match validation for verification.
- **Subtask B-AUTH-05.8:** Implement `POST /v1/auth/signup/step/dob` with YYYY-MM-DD format validation.
- **Subtask B-AUTH-05.9:** Implement `POST /v1/auth/signup/complete` to create user, create session, clear flow state.
- **Subtask B-AUTH-05.10:** Implement `GET /v1/auth/signup/state` for resumable client flow.

### Task B-AUTH-06 — Implement recover/reset pipeline
- **Subtask B-AUTH-06.1:** Implement `POST /v1/auth/recover/request`.
- **Subtask B-AUTH-06.2:** Implement anti-enumeration generic response for unknown identities.
- **Subtask B-AUTH-06.3:** Implement recover state persistence in Redis with TTL.
- **Subtask B-AUTH-06.4:** Implement per-IP and per-identity recover throttling.
- **Subtask B-AUTH-06.5:** Implement recover verification attempt limits.
- **Subtask B-AUTH-06.6:** Implement `POST /v1/auth/recover/verify` issuing one-time `reset_token`.
- **Subtask B-AUTH-06.7:** Implement replay guard for verified/reset-used states.
- **Subtask B-AUTH-06.8:** Implement `POST /v1/auth/recover/reset`.
- **Subtask B-AUTH-06.9:** Enforce password policy on reset.
- **Subtask B-AUTH-06.10:** Revoke all user sessions after successful password reset.

### Task B-AUTH-07 — Implement auth schema contracts
- **Subtask B-AUTH-07.1:** Define request/response schemas for login/signup/session/logout.
- **Subtask B-AUTH-07.2:** Define OTP send/verify/resend schema contracts.
- **Subtask B-AUTH-07.3:** Define signup-step and signup-state schema contracts.
- **Subtask B-AUTH-07.4:** Define recover request/verify/reset schema contracts.
- **Subtask B-AUTH-07.5:** Define canonical `UserRecord`, `AuthUserPublic`, and `SessionPublic` contracts.

### Task B-AUTH-08 — Implement backend auth test coverage
- **Subtask B-AUTH-08.1:** Add OTP verification service unit tests (`send`, `verify`, bad code, resend cooldown).
- **Subtask B-AUTH-08.2:** Add recover service unit tests (missing user generic response, verify+reset happy path, invalid code).
- **Subtask B-AUTH-08.3:** Add signup flow service unit tests (identity step creation, invalid order handling).
- **Subtask B-AUTH-08.4:** Assert auth routes are present in OpenAPI route tests.

---

## 3. Frontend implemented tasks

### Task F-AUTH-01 — Implement real auth API integration layer
- **Subtask F-AUTH-01.1:** Implement login API call (`/v1/auth/login`) with DTO mapping to client session payload.
- **Subtask F-AUTH-01.2:** Implement signup verification send API call (`/v1/auth/verification/send`).
- **Subtask F-AUTH-01.3:** Implement multi-call signup pipeline (`step/identity` -> `step/contact` -> `verification/verify` -> `step/verification` -> `step/dob` -> `signup/complete`).
- **Subtask F-AUTH-01.4:** Implement recover request API call (`/v1/auth/recover/request`).
- **Subtask F-AUTH-01.5:** Implement recover verify/reset chained call (`/v1/auth/recover/verify` + `/v1/auth/recover/reset`).
- **Subtask F-AUTH-01.6:** Implement in-memory recover-id mapping by identifier for recover flow continuity.
- **Subtask F-AUTH-01.7:** Implement API error translation via `ApiError` and auth error codes.

### Task F-AUTH-02 — Implement frontend auth validation guards
- **Subtask F-AUTH-02.1:** Implement identifier validator supporting email/phone/username.
- **Subtask F-AUTH-02.2:** Implement login input validation (required fields, minimum password length).
- **Subtask F-AUTH-02.3:** Implement signup input validation (required fields, email/phone format, OTP format, password policy).
- **Subtask F-AUTH-02.4:** Implement recover request identifier validation.
- **Subtask F-AUTH-02.5:** Implement reset password validation (OTP format, password constraints, confirm match).

### Task F-AUTH-03 — Implement auth mutations and keying strategy
- **Subtask F-AUTH-03.1:** Implement `useLoginMutation`.
- **Subtask F-AUTH-03.2:** Implement `useSignupMutation`.
- **Subtask F-AUTH-03.3:** Implement `useRecoverRequestMutation`.
- **Subtask F-AUTH-03.4:** Implement `useResetPasswordMutation`.
- **Subtask F-AUTH-03.5:** Implement auth mutation keys (`login`, `signup`, `recover`, `resetPassword`).
- **Subtask F-AUTH-03.6:** Wire successful login/signup to session establishment.

### Task F-AUTH-04 — Implement login view flow
- **Subtask F-AUTH-04.1:** Implement login form fields and required-field checks.
- **Subtask F-AUTH-04.2:** Implement submit/pending UX and disabled states.
- **Subtask F-AUTH-04.3:** Implement mutation call and success redirect.
- **Subtask F-AUTH-04.4:** Implement auth banner error rendering from API failures.
- **Subtask F-AUTH-04.5:** Implement remember-me capture and forgot-password entry link.

### Task F-AUTH-05 — Implement signup view (multi-step UX)
- **Subtask F-AUTH-05.1:** Implement step state machine with 5 steps (identity, DOB, contact, OTP, password).
- **Subtask F-AUTH-05.2:** Implement per-step field validation and error messages.
- **Subtask F-AUTH-05.3:** Implement OTP send call on contact step continuation.
- **Subtask F-AUTH-05.4:** Capture and persist verification id from send response.
- **Subtask F-AUTH-05.5:** Display dev OTP info banner when backend returns debug code.
- **Subtask F-AUTH-05.6:** Implement final signup mutation call and redirect on success.
- **Subtask F-AUTH-05.7:** Implement back navigation across steps with state/error reset behavior.

### Task F-AUTH-06 — Implement recover view flow
- **Subtask F-AUTH-06.1:** Implement recover request stage with identifier entry.
- **Subtask F-AUTH-06.2:** Implement reset stage with OTP + new password + confirm password.
- **Subtask F-AUTH-06.3:** Implement done stage with return-to-login action.
- **Subtask F-AUTH-06.4:** Implement stage-aware back navigation behavior.
- **Subtask F-AUTH-06.5:** Implement request/reset mutation wiring with banners and pending states.

### Task F-AUTH-07 — Implement auth modal routing gateway
- **Subtask F-AUTH-07.1:** Implement query-driven mode resolver (`?auth=login|signup|recover`).
- **Subtask F-AUTH-07.2:** Implement modal close behavior by removing `auth` query param.
- **Subtask F-AUTH-07.3:** Implement Escape-key close behavior.
- **Subtask F-AUTH-07.4:** Implement mode-to-view rendering (`LoginPageView`, `SignupPageView`, `RecoverPageView`).
- **Subtask F-AUTH-07.5:** Implement mode switch links preserving current route/query context.

### Task F-AUTH-08 — Implement auth session lifecycle provider
- **Subtask F-AUTH-08.1:** Implement localStorage-backed session persistence (`dl.auth.session.v1`).
- **Subtask F-AUTH-08.2:** Implement hydration before paint via `useLayoutEffect` to avoid auth flash.
- **Subtask F-AUTH-08.3:** Implement expiry validation and invalid-session cleanup during hydration.
- **Subtask F-AUTH-08.4:** Implement `isReady` readiness state and `isAuthenticated` derived state.
- **Subtask F-AUTH-08.5:** Implement `establishSession` and `clearSession`.
- **Subtask F-AUTH-08.6:** Wire access token getter into `apiClient` through `setApiAccessTokenGetter`.

### Task F-AUTH-09 — Implement auth UI component set and helpers
- **Subtask F-AUTH-09.1:** Implement reusable auth shell and field components (`AuthModalShell`, text/password/phone/select/otp fields).
- **Subtask F-AUTH-09.2:** Implement status banners and banner state hook (`useAuthResponseBanner`).
- **Subtask F-AUTH-09.3:** Implement provider/social row presentation components.
- **Subtask F-AUTH-09.4:** Implement shared auth button, divider, switch-link, and style primitives.
- **Subtask F-AUTH-09.5:** Implement module/component barrel exports for auth surfaces.

### Task F-AUTH-10 — Implement auth error messaging helpers
- **Subtask F-AUTH-10.1:** Implement `authErrorMessage` mapper for API vs generic errors.
- **Subtask F-AUTH-10.2:** Implement shared `AUTH_ERROR_CODES` catalog and typed contracts.

---

## 4. Legacy/compatibility implemented items

### Task F-AUTH-11 — Maintain mock auth store utilities (compat layer)
- **Subtask F-AUTH-11.1:** Keep localStorage mock user/recovery store helpers (`mockAuthStore.ts`).
- **Subtask F-AUTH-11.2:** Keep normalization/find helpers for identifier/email/phone/userName.
- **Subtask F-AUTH-11.3:** Keep mock recovery OTP helpers and password update helper.
- **Subtask F-AUTH-11.4:** Keep demo OTP constant for mock-only flows.

---

## 5. Not wired / not implemented (follow-up tickets, not claimed done)

- **Gap 01:** No dedicated frontend call for `/v1/auth/session` revalidation endpoint yet (session is localStorage-hydrated; API token validity checked indirectly by request failures).
- **Gap 02:** No frontend call for `/v1/auth/logout` endpoint from a centralized logout action in this analyzed auth module.
- **Gap 03:** `POST /v1/auth/signup/init` backend endpoint exists, but frontend signup path currently uses step-based orchestration and not `signup/init`.
- **Gap 04:** No dedicated end-to-end auth HTTP tests found for login/signup/session/logout routes (unit tests are present for verification/recover/signup-flow services).
- **Gap 05:** Frontend recover page label says “Email or phone number” while identifier validator allows username too.

---

## 6. Quick file reference

| Area | Path |
|------|------|
| Backend auth routes | `deltalabs-backend/app/api/v1/auth.py` |
| Identity service | `deltalabs-backend/app/domain/identity/service.py` |
| Identity repository | `deltalabs-backend/app/domain/identity/repository.py` |
| Signup flow service | `deltalabs-backend/app/domain/identity/signup_flow_service.py` |
| Verification service | `deltalabs-backend/app/domain/identity/verification_service.py` |
| Recover service | `deltalabs-backend/app/domain/identity/recover_service.py` |
| Identity schemas | `deltalabs-backend/app/domain/identity/schemas.py` |
| Frontend auth API | `deltalabs-frontend/src/modules/Auth/api/authApi.ts` |
| Frontend auth validation | `deltalabs-frontend/src/modules/Auth/api/authValidation.ts` |
| Frontend auth mutations | `deltalabs-frontend/src/modules/Auth/hooks/useAuthMutations.ts` |
| Frontend auth views | `deltalabs-frontend/src/modules/Auth/views/` |
| Modal gateway | `deltalabs-frontend/src/components/features/auth/master/AuthModalGateway.tsx` |
| Session context | `deltalabs-frontend/src/contexts/AuthSession_Context.tsx` |

---

*Generated from repository analysis for submission as a completed-work checklist. Keep section 5 as follow-up scope and sections 2–4 as delivered scope.*
