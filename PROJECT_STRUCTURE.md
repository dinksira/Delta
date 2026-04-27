# DeltaLabs Project Structure

This document focuses on the structure of the two primary applications:

- `deltalabs-frontend` (Next.js + TypeScript UI)
- `deltalabs-backend` (FastAPI + Python domain services)

## Repository Overview

At the monorepo root:

- `deltalabs-frontend`: web application (primary UI client)
- `deltalabs-backend`: API and domain logic
- `deltalabs-admin`, `deltalabs-desktop`, `deltalabs-mobile`: other app surfaces
- root `*.md` files: architecture and implementation planning documents

## Frontend Structure (`deltalabs-frontend`)

### High-level layout

- `src/app`: Next.js App Router entry points and route groups
- `src/modules`: feature/domain modules (business-oriented organization)
- `src/components`: reusable UI building blocks
- `src/contexts`: React contexts (session/global client state)
- `src/lib`: shared client-side utilities
- `src/store`: state management primitives
- `src/styles`: global style utilities
- `src/theme`: theme tokens/providers
- `src/types`: shared TypeScript type definitions
- `docs`: frontend-specific documentation
- `e2e`: end-to-end tests
- `public`: static assets

### `src/app` (routing layer)

- `(public)`: public-facing routes
- `(app)`: authenticated/internal app routes
- `api`: Next.js route handlers (if applicable)
- `layout.tsx`, `globals.css`: app-wide layout and global styling

### `src/modules` (feature modules)

Modules are organized by business area. Current examples include:

- `Auth`, `Dashboard`, `Features`
- `Feed`, `Library`, `Marketing`
- `School`, `Research`, `Planner`
- `Course`, `Certification`, `Competition`, `Chatroom`, etc.

Typical module internals (varies per module):

- `api`: feature API client calls
- `hooks`: React Query/custom hooks
- `types`: feature-specific typings
- `views`: page-level composed views
- `components`: module-scoped UI pieces

### `src/components` (cross-module UI)

- `features`: reusable feature UIs shared across screens
- `navigation`: shells, headers, nav components
- `system`: low-level UI/system components
- `theme`: theme-aware UI primitives/helpers

## Backend Structure (`deltalabs-backend`)

### High-level layout

- `app/main.py`: FastAPI app bootstrap and wiring
- `app/api`: HTTP layer (dependencies + versioned routers)
- `app/domain`: domain-driven business modules/services
- `app/core`: core configuration/constants
- `app/infra`: infrastructure adapters (db/redis/http/media signing)
- `app/jobs`: background or scheduled job-related code
- `app/compat`: compatibility shims/utilities
- `tests`: unit/integration/http tests
- `scripts`: local/dev scripts
- `postman`: API collection artifacts

### `app/api` (transport layer)

- `deps.py`: shared request dependencies
- `deps_authz.py`: authorization dependency helpers
- `v1/`: API v1 route registration and endpoint modules

### `app/domain` (business logic layer)

Domain modules are grouped by capability, for example:

- `authorization`, `identity`, `engagement`, `school`
- `course`, `certification`, `research`, `rent_lab`
- `learning`, `content`, `library`, `planner`, etc.

Typical domain internals:

- `schemas.py`: request/response and domain model schemas
- `service.py`: application/domain service logic
- `repository.py`: data access abstractions/queries
- optional helpers and module-local constants

### `app/infra` (infrastructure adapters)

- `database.py`: database connectivity/session helpers
- `redis_client.py`: Redis access
- `http_client.py`: outbound HTTP helper/wrapper
- `media_signer.py`: media signing/storage integration helpers

### `tests` (quality layer)

- `unit/`: isolated logic tests
- `integration/`: integration-level tests
- root `test_*.py`: API/http and system behavior tests

## Suggested Reading Order For New Contributors

1. Read `deltalabs-backend/README.md` and `deltalabs-frontend/README.md`.
2. Inspect `deltalabs-backend/app/main.py` to understand backend composition.
3. Inspect `deltalabs-frontend/src/app/layout.tsx` and route groups.
4. Follow one feature vertically (recommended: `School`) across:
   - frontend `src/modules/School` + `src/components/features/school`
   - backend `app/api/v1` + `app/domain/school`
5. Run tests in both apps to verify baseline behavior before changes.

## Notes

- This document describes the current folder shape and intended responsibilities.
- As features evolve, keep this file updated with new top-level modules and moved concerns.
