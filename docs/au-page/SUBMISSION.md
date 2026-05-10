# (AU Page) Authentication — Task submission

This file is the **submission cover page** for the assigned AU Page architecture task.

---

## Task interpretation (what was requested)

The assignment “System Architecture Diagram Design (AU Page)” was interpreted as delivering **architecture/design artifacts** (not UI mockups) for the Authentication page, broken into these subtasks:

1. **System flow diagram** — show the AU page in the context of client/edge/backend/stores and trust boundaries.
2. **Backend design diagram** — show the backend auth service decomposition and where data/state lives.
3. **Frontend component optimization + integration design** — show how AU views integrate with session state, API calls, and middleware gating, and why it’s designed that way.

---

## Delivered artifacts (separate files)

- **System flow diagram**: `docs/au-page/system-flow-diagram.md`
- **Backend design diagram**: `docs/au-page/backend-design-diagram.md`
- **Frontend integration & optimization**: `docs/au-page/frontend-integration-and-optimization.md`
- **AuthZ design (org-based RBAC)**: `docs/au-page/authz-org-rbac-design.md`
- **Presentation script (explanations)**: `docs/au-page/diagram-explanations.md`

## Downloadable diagram sources

If you need the diagrams for PowerPoint or external docs, the raw Mermaid sources are available as files:

- `docs/au-page/diagrams/system-flow.mmd`
- `docs/au-page/diagrams/backend-design.mmd`
- `docs/au-page/diagrams/frontend-integration.mmd`

These can be opened directly or pasted into a Mermaid renderer to export **SVG/PNG**.

Each artifact includes:

- A “**What the subtask requires**” section
- “**Verified implementation (evidence)**” pointers to the exact code files
- A **Mermaid diagram** (GitHub-renderable)
- “Implemented vs not implemented” accuracy notes where relevant

---

## Implementation validation summary (what we verified in code)

- **Frontend AU integration**
  - Uses React Query mutations that establish a session on success.
  - Persists session in localStorage and sets a **cookie presence marker** for middleware.
  - Central API client attaches `Authorization: Bearer <token>` for authenticated calls.
- **Backend auth**
  - `/v1/auth/*` routes exist for login/session/logout, signup flow, OTP verify, and recovery.
  - Passwords are hashed with **scrypt** + salt; sessions stored as **token hashes** with expiry.
  - OTP/recover/signup states are **Redis TTL** states with throttles/cooldowns.

---

## Accuracy: what is NOT done yet (explicitly excluded)

- **Real OTP delivery** (email/SMS provider integration) is **not wired** yet in this repo.
- **Login brute-force throttling** is not implemented yet (OTP/recover throttles exist).

