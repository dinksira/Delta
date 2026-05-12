# Folder structure, AU diagrams, and theme (brief)

Short reference for **where code lives**, what the **AU system/backend diagrams** show, and how **theme / styling** is wired on the frontend.

---

## 1. Folder structure (what we use)

### Repository (top level)

| Path | Role |
|------|------|
| `deltalabs-frontend/` | Next.js app: routes, UI, client state, auth UI + session |
| `deltalabs-backend/` | FastAPI: `/v1/auth/*`, identity, Redis/Mongo |
| `deltalabs-mobile/` | Flutter client (separate from web AU diagrams) |
| `deltalabs-admin/`, `deltalabs-desktop/` | Other apps (not covered by AU page diagrams) |
| `docs/` | Human-facing architecture, AU submission, auth notes |

### `deltalabs-frontend/src/` (web app)

| Path | Purpose |
|------|---------|
| `app/` | Next.js **App Router**: route segments only. Files are thin; they import one **view** from `modules/`. |
| `app/(public)/` | Public shell: marketing, legal, **`/login`**, **`/signup`**, explorer entry, etc. |
| `app/(app)/` | Signed-in area: dashboard, features hub, school workspace, etc. |
| `modules/<Name>/` | **Domain slice** per feature: `views/` (screens), `hooks/`, `api/`, `types/` as needed. **`modules/Auth/`** holds login, signup, recover views and auth mutations. |
| `components/theme/` | **Design-system primitives** (Button, Input, Field, Typography, …) shared across features. |
| `components/features/<feature>/` | **Feature composites** reused by modules (e.g. `auth/`, `feed/`, `school/`). |
| `components/navigation/` | App shell, top nav, layout chrome. |
| `contexts/` | Cross-cutting React context (e.g. **`AuthSession_Context`**, **`Theme_Context`** / `ThemeProvider`). |
| `lib/` | Shared utilities: **`apiClient`**, auth helpers, redirects, etc. |
| `store/` | Redux Toolkit slices and typed hooks (used where cross-route client state is needed). |
| `styles/` | Global CSS; **`design-tokens.css`** defines CSS custom properties (colors, spacing, layout). |
| `theme/` | App bootstrap (e.g. **`Root.tsx`**) wiring providers (theme, query, session, …). |
| `middleware.ts` | Edge: protected-route redirects using the **auth cookie marker**. |

**Convention:** `app/**/page.tsx` stays small; **`modules/<Module>/views/*PageView.tsx`** owns screen composition and calls feature components + hooks.

---

## 2. Diagrams we prepared (AU page)

### System flow diagram

- **Doc:** `docs/au-page/system-flow-diagram.md`
- **What it shows:** End-to-end **architecture** (not a user click journey): browser AU UI → `apiClient` + session in **localStorage** + **cookie marker** → **middleware** gating → backend **`/v1/auth/*`** → **MongoDB** (durable users/sessions) and **Redis** (OTP / signup / recover TTL state). It also marks **SMS/email** as future, not wired.
- **Why it exists:** AU submission asked for a single picture of **trust boundary**, **storage split**, and **what is implemented vs stubbed**.

### Backend design diagram

- **Doc:** `docs/au-page/backend-design-diagram.md`
- **What it shows:** FastAPI **auth routes** delegating into **identity** services (login, signup flow, verification, recover), **authorization (RBAC)** touching Mongo, and **security helpers** (password hashing, session token hashing). Same **Mongo vs Redis** split and **OTP provider** gap as the system flow doc.
- **Why it exists:** AU submission asked for **service decomposition** and **security primitives** in one view.

### Frontend component hierarchy (AUTH UI only)

- **Simple layered diagram:** `docs/au-page/frontend-auth-component-hierarchy-simple.md`
- **Detailed tree + mermaid:** `docs/au-page/frontend-auth-component-hierarchy.md`

---

## 3. Theme — what we use and why

| Piece | Role |
|-------|------|
| **`src/styles/design-tokens.css`** | Source of **CSS variables** (`--color-*`, `--dl-layout-*`, auth modal tokens, etc.). Imported from **`src/app/globals.css`**. |
| **Tailwind** | Utility classes in components; semantic names map to tokens (e.g. `text-text-primary`, `bg-surface-default`, `border-border-default`, auth-specific classes like `bg-auth-modal-surface`). |
| **`ThemeProvider`** (`src/contexts/Theme_Context.tsx`) | **Light / dark / system** mode: persists choice, applies `light` / `dark` on `<html>` for Tailwind dark mode. |
| **`Root`** (`src/theme/Root.tsx`) | Wraps the app with **ThemeProvider** plus other global providers (query client, session, Redux where used). |
| **`src/components/theme/`** | Reusable **primitives** so screens do not reimplement inputs, typography, and layout patterns. Feature folders (`components/features/auth/`) compose these for AU-specific UX. |

**Order of dependency (styling):** tokens in CSS → global/Tailwind usage → theme primitives → feature composites → module views.

For layout and breakpoints discipline on new UI, see also: `deltalabs-frontend/docs/frontend-responsiveness-standard.md`.
