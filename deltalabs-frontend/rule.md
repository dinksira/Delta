---
title: Delta Labs Frontend Standards
---

# Delta Labs Frontend Standards (Next.js + TypeScript)

> **Version**: 1.1.0  
> **Status**: Official — All frontend code MUST follow this document  
> **Scope**: Next.js App Router, TypeScript, Tailwind, design system  

> **Companion:** `docs/frontend-architecture.md` — concrete module map, routing groups, and state split (React Query vs Redux vs Context). Keep it in sync when structure changes.

---

## 1. Frontend Stack & Principles

### 1.1 Stack

- Next.js (App Router) + React (current LTS on the project).
- TypeScript (strict).
- Next.js build/runtime (no standalone Vite app for core frontend).
- Tailwind CSS with a **design-token** layer.
- Lucide React icons.
- **TanStack React Query** — server/async cache and mutations.
- **Redux Toolkit** + **react-redux** — shared **client** UI state that crosses routes or many components (add slices in `src/store/`; do not duplicate server cache here).

### 1.2 Principles

- **Module-first**: Every product area is a `src/modules/[ModuleName]` module.
- **Single UI library**: All primitives are in `src/components/theme/`.
- **Design tokens only**: No hex colors, custom fonts, or random spacing values.
- **Thin pages**: route pages compose child components and hooks; they do not embed complex logic.
- **Network isolation**: Data fetching lives in **hooks** or in the `api/` layer, never in UI components directly.
- **Server/client boundary clarity**: prefer Server Components by default, add `"use client"` only where interactivity is required.

### 1.3 Modern Baseline (Required)

- **Rendering strategy**:
  - Default to Server Components for route rendering.
  - Use Client Components only for interactivity (`useState`, event handlers, browser APIs).
  - Use streaming/loading boundaries where page latency is noticeable.
- **Page strategy**:
  - Marketing/public pages should use static generation or ISR where possible.
  - App pages should use server rendering plus client hydration only where needed.
- **Type safety and contracts**:
  - All API payloads must use typed DTOs and schema validation at boundaries.
  - Avoid `any`; prefer exact interfaces and discriminated unions.
- **Performance defaults**:
  - Use Next `Image` for media.
  - Use `next/font` for font loading.
  - Apply lazy loading and code-splitting for heavy UI blocks.
- **Quality gates**:
  - PR checks must include typecheck, lint, build, and tests.
  - Do not merge if Core Web Vitals regressions are detected on critical pages.

---

## 2. Directory Structure

```text
src/
├── app/
│   ├── (public)/
│   │   └── page.tsx            # Public landing page(s)
│   ├── (app)/
│   │   ├── layout.tsx          # Authenticated app shell
│   │   └── dashboard/page.tsx
│   ├── api/                    # Next route handlers (only for light edge/web tasks)
│   ├── layout.tsx              # Root layout
│   └── globals.css
├── components/
│   ├── theme/                  # UI primitives (Button, Card, Input, etc.)
│   ├── navigation/             # Nav bars, sidebars, breadcrumbs
│   └── features/               # Cross-module composites (e.g., CourseList)
├── contexts/                   # Global app contexts (e.g. Auth session, Theme, Feature tabs)
├── store/                      # Redux Toolkit store, slices, typed hooks (`src/store/`)
├── modules/
│   ├── Auth/                   # Sign-in, sign-up, recovery; mock/real auth API + types
│   ├── Marketing/              # Legal / static marketing views (e.g. terms, privacy)
│   ├── Features/               # Authenticated features hub (e.g. workspace grid)
│   ├── Dashboard/              # App dashboard shell until domain dashboards land
│   ├── Feed/                   # Public explorer: video feed + module hubs (`/audio`, `/ai`, …); not auth/legal
│   ├── School/
│   ├── Course/
│   ├── Planner/
│   ├── Certification/
│   ├── Chatroom/
│   ├── Tutorials/
│   ├── Research/
│   ├── Competition/
│   ├── Specialization/
│   ├── Library/
│   ├── CourseSupport/
│   ├── RentLab/
│   └── HelpSupport/
├── theme/
│   ├── designTokens.ts
│   └── typography.ts
├── types/
│   └── global.d.ts
├── styles/
│   └── design-tokens.css
└── lib/
    ├── apiClient.ts
    ├── queryClient.ts
    └── config.ts

docs/
└── frontend-architecture.md    # Module ownership + state conventions (non-normative detail)
```

---

## 3. Module Layout & Rules

### 3.1 Standard Module Layout

Example for **`Feed`** (public stream — auth, legal, and app hub live in **`Auth`**, **`Marketing`**, **`Features`**, **`Dashboard`**, not inside `Feed`). All modules follow the same folder idea:

```text
src/modules/Feed/
├── views/
│   ├── LandingPageView.tsx     # Implemented: public landing feed
│   └── FeedSettingsPage.tsx    # Example only when needed
├── context/
│   ├── Feed_Context.tsx
│   └── FeedContext.types.ts
├── features/
│   ├── content-cards/
│   │   ├── VideoCard.tsx
│   │   ├── AudioCard.tsx
│   │   ├── SimulationCard.tsx
│   │   └── FeedCard.types.ts
│   ├── interactions/
│   │   ├── LikeButton.tsx
│   │   ├── CommentSheet.tsx
│   │   ├── ShareMenu.tsx
│   │   ├── FavoriteToggle.tsx
│   │   └── EnrollCTA.tsx
│   └── layout/
│       └── FeedShell.tsx
├── api/
│   ├── feedApi.ts
│   └── feedApi.types.ts
├── hooks/
│   ├── useInfiniteFeed.ts
│   ├── useFeedEngagement.ts
│   └── useFeedFilters.ts
├── routing/
│   ├── guards/
│   │   └── RequireAuthGuard.tsx
│   └── hooks/
│       └── useFeedNavigation.ts
├── types/
│   └── FeedTypes.ts
├── utils/
│   ├── mappers.ts
│   └── formatters.ts
└── index.ts
```

**Rules:**

- Every new screen goes into `views/`.
- Route entrypoints live in `src/app/**/page.tsx` and compose module `views/` components.
- Cross-cutting UI for that module goes into `features/`.
- All HTTP logic goes into `api/` and `hooks/`.
- Shared logic between modules goes into `components/features` or shared hooks at the root, not cross-imported between modules.

### 3.2 Naming Conventions

| Item         | Convention            | Example                         |
|--------------|-----------------------|---------------------------------|
| Component    | `PascalCase.tsx`      | `CourseCard.tsx`               |
| Hook file    | `useCamelCase.ts`     | `useCourseNavigation.ts`       |
| Context file | `[Module]_Context.tsx`| `School_Context.tsx`           |
| Folder       | `kebab-case`          | `content-cards/`               |
| Variable     | `camelCase`           | `enrolledCourses`              |
| Constant     | `UPPER_SNAKE_CASE`    | `MAX_PAGE_SIZE`                |
| Type         | `PascalCase`          | `CourseSummary`, `FeedItem`    |

---

## 4. Component Standards

### 4.1 File Template

- Doc comment at the top.
- Imports grouped and ordered (React → external libs → `@/` → relative).
- Types and variant maps outside the component.
- Component definition with well-typed props.
- Named or default export (consistent per module).

### 4.2 Component Single Source of Truth (Strict)

- `src/components/theme/` is the **single source of truth** for base primitives:
  - Button, Input, Select, Checkbox, Modal/Dialog, Tabs, Card, Badge, Table, etc.
- Product modules (`src/modules/**`) must **compose** these primitives and must not create competing base components.
- Any global visual or behavior change (spacing, radius, variants, focus ring, states) must be implemented in `src/components/theme/` first.
- New variants are added in the source component API (e.g. `variant`, `size`) and reused everywhere.
- Avoid duplicate primitives such as `PrimaryButton`, `AppButton`, `FeedButton` across modules unless they are module-specific wrappers over the shared `Button`.
- If a module needs custom behavior:
  - Prefer a wrapper component in that module that internally uses the shared primitive.
  - Do not fork the shared primitive into module folders.

### 4.3 Styling

- Use Tailwind classes only.
- No hex colors; all colors must map to design tokens.
- Class order:
  - Layout → Spacing → Typography → Colors → Borders → Effects → States.

Example:

```tsx
className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg shadow-sm hover:bg-primary-700 transition-colors duration-200"
```

### 4.4 Design Tokens

All tokens live in `theme/designTokens.ts` and `styles/design-tokens.css`. They define:

- Color tokens (primary, secondary, success, warning, error, surface, text).
- Typography tokens (fonts and sizes).
- Spacing scale.
- Z-index map.

**Rule:** When design needs to change, update tokens and shared theme primitives first.

---

## 5. State Management

### 5.1 Global Contexts (`src/contexts/`)

- **`AuthSessionProvider`** (`AuthSession_Context`):
  - Client session payload, `establishSession` / `clearSession`, storage hydration.
- **`Theme_Context`**:
  - Theme mode (light/dark/system).
- **`FeatureTabs_Context`** (optional):
  - Feature browser / workspace tab UI where used.

### 5.2 Redux Toolkit (`src/store/`)

- Use for **client** state shared across the app (e.g. feed UI chrome, layout prefs).
- Prefer **`createSlice`** + **`configureStore`**; export typed **`useAppDispatch`** / **`useAppSelector`** from `src/store/hooks.ts`.
- **Do not** mirror React Query cache in Redux; server data stays in Query.

### 5.3 Module Contexts (`modules/[Module]/context/`)

- Hold module-specific **UI state** and derived data.
- Implemented with `useReducer` and `React.createContext`.

Pattern:

```ts
type FeedAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ITEMS"; payload: FeedItem[] }
  | { type: "APPEND_ITEMS"; payload: FeedItem[] }
  | { type: "SET_ERROR"; payload: string | null };

function feedReducer(state: FeedState, action: FeedAction): FeedState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ITEMS":
      return { ...state, items: action.payload };
    case "APPEND_ITEMS":
      return { ...state, items: [...state.items, ...action.payload] };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}
```

### 5.4 Server State (Data Fetching)

- Use **TanStack React Query** for API-backed data and mutations.
- Each module has its own **data hooks** (`useCourses`, `useEnrollments`, `useFeedClips`, `useFeedComments`, …).
- Cache keys must be stable and namespaced (e.g. `feedQueryKeys.clips()`, `["auth","login"]`).
- While APIs are missing, **mock `queryFn`s** are acceptable behind the same hook names so views do not churn twice.

---

## 6. Networking & API Client

### 6.1 `apiClient`

- Implemented in `lib/apiClient.ts` using `fetch` or Axios.
- Responsibilities:
  - Set base URL.
  - Attach auth tokens.
  - Add `X-Request-Id` (if available).
  - Normalize error responses into a standard `ApiError`.

### 6.2 Module API Layer

- Each module defines its API wrapper functions:
  - `src/modules/Feed/api/feedApi.ts` (add when the stream API exists)
  - `src/modules/Auth/api/authApi.ts` (mock today; swap internals for real HTTP later)
  - `src/modules/Course/api/courseApi.ts`

Example:

```ts
export async function fetchFeedPage(
  params: FeedQueryParams,
): Promise<PaginatedResponse<FeedItemDto>> {
  const res = await apiClient.get<PaginatedResponse<FeedItemDto>>("/v1/feed/stream", { params });
  return res.data;
}
```

---

## 7. Routing

### 7.1 App Router (`src/app`)

- Next.js `app` directory defines top-level route segments.
- Each route uses `page.tsx`; shared wrappers use `layout.tsx`.
- Use route groups like `(public)` and `(app)` to separate unauthenticated and authenticated areas.

### 7.2 Module Route Integration

- Route files in `src/app/**/page.tsx` should remain thin and render module `views/` components.
- Avoid duplicate business logic in route files.

### 7.3 Guards and Access Control

- Primary access control should be handled in Next middleware and/or server-side auth checks.
- UI-level guards may still exist in `modules/[Module]/routing/guards/` for component rendering control.
- Guard rules include:
  - Auth requirements.
  - Enrollment requirements (`requiresEnrollment(courseId)`).

---

## 8. Error Handling (Frontend)

- All API failures must:
  - Be converted to user-friendly messages.
  - Never show raw error codes or stack traces.
- Module contexts store error messages and show them using:
  - Global toast system or module-specific banners.

---

## 9. Testing (Frontend)

- **Unit tests**:
  - Hooks and utilities using Vitest.
- **Component tests**:
  - Use React Testing Library.
- **E2E**:
  - Use Playwright for core flows:
    - Feed scroll & enroll.
    - Create/manage school.
    - Complete course content and see progress.

> **Rule:** Every critical user flow (feed viewing, enrollment, learning panel) must have end-to-end coverage.

---

## 10. Performance & Accessibility

- Use virtualized lists for feed and large lists.
- Lazy load heavy components.
- All interactive elements must:
  - Be reachable by keyboard.
  - Have ARIA labels when needed.
- Prefer semantic HTML elements over `div` soup.

---

## 11. Summary

This document defines **how** we build the frontend: structure, patterns, and hard rules.  
For **where** implemented modules live and how **Query vs Redux vs Context** are split day-to-day, see **`docs/frontend-architecture.md`**.  
For backend architecture and code standards, see `Delta Labs Backend Standards`.  
For cross-cutting topics (security, devops, AI), see the global engineering standards.

