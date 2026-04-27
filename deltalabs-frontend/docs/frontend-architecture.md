# Delta Labs frontend architecture

This note complements `rule.md` with **where code lives** and **how state is split**. Update it when conventions change.

## Routing

- **`src/app/(public)/`** — Marketing and auth entry (`/`, `/login`, `/signup`, `/terms`, `/privacy`). Uses `PublicLayoutShell` + `TopNav`.
- **`src/app/(app)/`** — Signed-in shell (`AppShell`): `/dashboard`, `/features`, `/features/school` (School workspace: screens in `modules/School/views/`, composites in `components/features/school/`), `/enrolled-courses`.
- **Middleware** (`src/middleware.ts`) — Cookie-based redirects for protected vs auth pages.

Route files stay **thin**: they import a single view from `src/modules/<Module>/views/`.

## Modules (domain folders)

| Module        | Responsibility                                      |
|---------------|-----------------------------------------------------|
| **`Auth`**    | Login, signup, recovery views; mock `authApi`; auth mutations & types. |
| **`Marketing`** | Legal / static marketing views (terms, privacy) only. |
| **`Features`**  | Authenticated features hub (workspace grid + tabs). |
| **`Dashboard`** | App dashboard placeholder until domain dashboards land. |
| **`Feed`**    | Public **explorer** surface: video `LandingPageView`, module hub shells (`/audio`, `/ai`, `/simulation`, `/explore`) sharing `FeedExplorerShell` + `FeedSearchInput` / `FeedFilterPanel`; mock clip data; `useFeedClips` / `useFeedComments`. |
| **`School`**  | School workspace under `/features/school`: **`views/`** compose **`components/features/school/`** (rail, shell, cards, tables — same pattern as `feed/`); `modules/School/types/` for route query guards. Future domain **features** (e.g. enrollment, roster) stay in `modules/School/` as `api/`, `hooks/`, etc. |

Other scaffold modules under `src/modules/*` (Course, …) follow the same layout as they are implemented.

## Cross-cutting UI

- **`src/components/theme/`** — Design-system primitives (Button, Input, Typography, …).
- **`src/components/features/`** — Shared composites (e.g. `feed/*`, `auth/*`, `school/*`) used by one or more modules.
- **`src/components/navigation/`** — Shells, `TopNav`, `AppShell`.

## Responsiveness (mobile-first + layout tokens)

- **Order:** tokens → theme → features → shells → module views (see `docs/frontend-responsiveness-standard.md`).
- **Layout constants** (`--dl-layout-*`) live in `src/styles/design-tokens.css`; reuse them instead of copying pixel/rem values into multiple components.

## State

| Concern              | Tool |
|----------------------|------|
| Server / cached API  | **TanStack React Query** (`QueryProvider` in `Root`). Prefer `useQuery` / `useMutation` in `modules/<X>/hooks`. |
| Global client UI     | **Redux Toolkit** (`src/store/`) — start with focused slices (e.g. `feedUi` for comment sidebar). |
| Auth session         | **`AuthSessionProvider`** (`src/contexts/AuthSession_Context.tsx`). |
| Theme                | **`ThemeProvider`**. |
| Local / screen scope | **`useState` / `useRef`** in views and leaf components. |

**Rule of thumb:** API data → Query. Cross-route or multi-component client rules → Redux slice. Everything else → local state.

## Redux store

- **`src/store/store.ts`** — `configureStore`.
- **`src/store/*Slice.ts`** — Feature slices (`createSlice`).
- **`src/store/selectors.ts`** — Typed selectors using `RootState`.
- **`src/store/hooks.ts`** — `useAppDispatch`, `useAppSelector`.
- **`Root`** wraps the app with `<Provider store={store}>` (client).

## Feed data (until API exists)

- Clips: `modules/Feed/data/mockVideoFeed.ts` + **`useFeedClips`**.
- Comments: `modules/Feed/data/mockComments.ts` + **`useFeedComments(clipId)`**.
- Demo presenter (creator row): `modules/Feed/data/landingFeedPresenter.ts`.

Swap `queryFn` implementations later; keep hook names stable so views change minimally.
