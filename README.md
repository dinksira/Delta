<p align="center">
  <img src="deltalabs-frontend/public/delta-labs.png" alt="Delta Labs" width="110" />
</p>

<h1 align="center">Delta Labs</h1>

<p align="center">
  <strong>A multi-tenant learning ecosystem spanning web, mobile, and desktop.</strong>
</p>

<p align="center">
  <a href="./docs/README.md"><strong>Documentation</strong></a>
  &nbsp;·&nbsp;
  <a href="./delta-labs-ai-context.md"><strong>Engineering Context</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/DeltaRabbitElectrons/Delta_Labs"><strong>Repository</strong></a>
</p>

---

## Overview

Delta Labs is a single monorepo holding every surface of the product. One
FastAPI service owns the domain and data layer; four clients consume it.

```
                         ┌──────────────────────────┐
                         │   FastAPI  ·  MongoDB     │
                         │   /v1  ·  Redis          │
                         └────────────┬─────────────┘
                                      │  REST + WebSocket
        ┌──────────────┬──────────────┼──────────────┬───────────────┐
        │              │              │              │               │
   ┌────┴────┐   ┌─────┴─────┐   ┌────┴─────┐   ┌────┴────┐   ┌──────┴──────┐
   │   Web   │   │  Desktop  │   │  Mobile  │   │  Admin  │   │  Media Svc  │
   │ Next.js │   │  Electron │   │  Flutter │   │ (future)│   │  (ffmpeg)   │
   └─────────┘   └───────────┘   └──────────┘   └─────────┘   └─────────────┘
```

Everything the API exposes is versioned under `/v1`, authenticated with
short-lived access tokens plus rotating refresh cookies, and authorized
per-organization through a role-based access layer.

---

## Repository Layout

| Path | Stack | Role |
| :--- | :--- | :--- |
| [`deltalabs-frontend`](./deltalabs-frontend) | Next.js 15 · React 19 · Tailwind v4 | Primary web client and the shared component library |
| [`deltalabs-backend`](./deltalabs-backend) | FastAPI · MongoDB · Redis | Domain services, persistence, realtime, media processing |
| [`deltalabs-desktop`](./deltalabs-desktop) | Electron 31 · Vite · React 19 | Native desktop shell wrapping the product surfaces |
| [`deltalabs-mobile`](./deltalabs-mobile) | Flutter · Riverpod · Drift | Offline-first iOS and Android client |
| [`deltalabs-admin`](./deltalabs-admin) | — | Reserved for the internal management console |
| [`docs`](./docs) | Markdown | System design, data models, and feature specifications |
| [`delta-labs-ai-context.md`](./delta-labs-ai-context.md) | Markdown | Product, design-system, and coding standards for the whole repo |

---

## Platform Details

### Web — `deltalabs-frontend`

The largest surface, and the home of the design system every other client
follows.

- **App Router** with 53 routed pages under `src/app`.
- **22 feature modules** in `src/modules`, each owning its own views, hooks,
  and types: `Auth`, `Course`, `Feed`, `School`, `Competition`, `Library`,
  `Planner`, `Research`, `Specialization`, `Certification`, `Chatroom`,
  `RentLab`, `Tutorials`, and more.
- **Atomic Design component library** in `src/components` — 13 atoms, 74
  molecules, 75 organisms, plus `theme` primitives (`Button`, `Field`,
  `Input`, `Textarea`, `Modal`, and friends).
- **Data layer** — TanStack Query for server state, Redux Toolkit for client
  state, `tailwind-merge` for token-safe class composition.
- **Tests** — 26 Vitest suites with Testing Library, plus Playwright for
  end-to-end coverage.

```bash
cd deltalabs-frontend
npm install
npm run dev          # http://localhost:4000
npm run typecheck
npm run lint
npm test
npm run build
```

### Backend — `deltalabs-backend`

- **FastAPI** on Python 3.11, served by Uvicorn, configured through
  `pydantic-settings`.
- **MongoDB** via the async `motor` driver; **Redis** for caching, presence,
  and the live-duel realtime fabric.
- **23 route modules** under `app/api/v1`, each mirroring a domain package
  (29 in total) that holds its own models, repository, and service.
- **Media pipeline** with a dedicated `docker-compose.media.yml` and
  `Dockerfile`; Railway deployment config included.

### Desktop — `deltalabs-desktop`

Electron 31 with a Vite 5 build, React 19, Tailwind v4, Redux Toolkit, and
`electron-builder` for packaging. It ports the product surfaces rather than
forking the logic.

### Mobile — `deltalabs-mobile`

Flutter with Riverpod 3 for state, `go_router` for navigation, `dio` for HTTP,
and **Drift** for a local SQLite store so the app stays usable offline.

---

## Architecture Principles

1. **One API, many clients.** Feature parity is the default; a capability is
   not considered shipped until every active surface supports it.
2. **Tokens over hardcoded values.** Colors, spacing, radii, and typography
   come from the design tokens. No inline hex or arbitrary utility values in
   components.
3. **Reuse before creation.** The component catalog in
   [`delta-labs-ai-context.md`](./delta-labs-ai-context.md) is the source of
   truth. New UI is added to the library, documented, then consumed — never
   duplicated inside a feature.
4. **Atomic layering is enforced.** Atoms → Molecules → Organisms → Templates
   → Pages, with no upward imports.
5. **Accessibility is a requirement, not a pass.** Dialogs trap and restore
   focus, popovers dismiss on Escape and outside press, live regions announce
   updates, and every control carries an accessible name.
6. **Small, single-purpose units.** Files stay under 500 lines and functions
   near 50, so the intent of a module is readable at a glance.
7. **Test what users do.** Behavior is asserted through accessible roles and
   names rather than implementation detail or CSS selectors.

---

## Documentation

Start at [`docs/README.md`](./docs/README.md). Notable areas:

| Area | Entry point |
| :--- | :--- |
| Architecture | [au-page-architecture-delivery.md](./docs/au-page-architecture-delivery.md) |
| Authentication | [auth-overview.md](./docs/auth-overview.md) · [auth-one-pager.md](./docs/auth-one-pager.md) |
| Data model | [database-schema.md](./docs/database-schema.md) |
| Feed & ranking | [feed-page/README.md](./docs/feed-page/README.md) |
| School & classrooms | [school-features/](./docs/school-features) |
| Competitions | [Competition_module.md](./docs/Competition_Docs/Competition_module.md) |
| Frontend standards | [delta-labs-ai-context.md](./delta-labs-ai-context.md) |

---

## Contributing

1. Branch from `Desktop` — the integration branch for this repository.
2. Read [`delta-labs-ai-context.md`](./delta-labs-ai-context.md) first. It
   carries the product context, design system, and coding standards, and it is
   the fastest way to avoid duplicating something that already exists.
3. Keep changes scoped: one concern per commit, descriptive messages, no
   unrelated churn in the same diff.
4. Before opening a pull request, run `npm run typecheck`, `npm run lint`, and
   `npm test` in `deltalabs-frontend`, and the backend test suite if you
   touched the API.

---

## Status

Active work lands on `Desktop`. The admin console is the one declared surface
with no implementation yet — the directory is a placeholder. The web client,
backend, desktop shell, and mobile app are all under active development, so
expect the documentation to evolve alongside the code.

---

<p align="center">
  <em>Empowering education through technology.</em>
</p>
