# Features — implementation analysis & completed-work task list

**Purpose:** Deep analysis of the **Features** vertical in **Deltalabs** (`deltalabs-backend` + `deltalabs-frontend`), documented as submission-ready **Task / Subtask** records.  
**Scope:** What is implemented in the repository today, plus explicit follow-up gaps.

---

## 1. Executive summary

| Layer | Summary |
|------|---------|
| **Backend** | `/v1/features` and `/v1/orgs/{org_id}/features` routes are implemented with authorization-profile driven capability flags (`canView`, `canJoin`, `canCreate`, `canManage`). Catalog is backed by Mongo `feature_catalog`, with seed rows in local env and index bootstrap. |
| **Frontend** | Features API client is implemented for global and org-scoped endpoints. `FeaturesPageView` fetches the list, merges backend data with a default 10-card catalog, enforces auth-ready query gating, renders capability-aware availability, and opens workspace tabs. |
| **Current maturity** | Core listing + card experience is implemented. Feature detail and org-scoped UI consumption are mostly API-ready but not fully wired in UI screens. |

---

## 2. Backend implemented tasks

### Task B-FEAT-01 — Implement feature catalog HTTP routes
- **Subtask B-FEAT-01.1:** Implement legacy compatibility list route `GET /v1/features`.
- **Subtask B-FEAT-01.2:** Implement legacy compatibility detail route `GET /v1/features/{feature_key}`.
- **Subtask B-FEAT-01.3:** Implement org-scoped list route `GET /v1/orgs/{org_id}/features`.
- **Subtask B-FEAT-01.4:** Implement org-scoped detail route `GET /v1/orgs/{org_id}/features/{feature_key}`.
- **Subtask B-FEAT-01.5:** Apply auth dependency (`get_current_user`) to feature routes.
- **Subtask B-FEAT-01.6:** Apply org-membership guard (`require_org_membership`) to org-scoped routes.

### Task B-FEAT-02 — Implement compatibility access strategy for legacy features route
- **Subtask B-FEAT-02.1:** Resolve default org scope via `authz_default_org_slug`.
- **Subtask B-FEAT-02.2:** Build access profile through authorization service.
- **Subtask B-FEAT-02.3:** Implement permissive synthetic fallback when membership state is `none` in default workspace (compat mode).

### Task B-FEAT-03 — Implement feature catalog service layer
- **Subtask B-FEAT-03.1:** Implement `bootstrap_catalog` orchestration for indexes and optional local seed.
- **Subtask B-FEAT-03.2:** Implement `list_features` mapping from repository docs to response DTOs with access-profile capabilities.
- **Subtask B-FEAT-03.3:** Implement `get_feature` lookup and not-found error (`feature_not_found`).

### Task B-FEAT-04 — Implement feature catalog repository and persistence
- **Subtask B-FEAT-04.1:** Implement unique index on `feature_key` (`uq_feature_catalog_feature_key`).
- **Subtask B-FEAT-04.2:** Implement index on `enabled` + `sort_order` for list query efficiency.
- **Subtask B-FEAT-04.3:** Implement enabled-only list query sorted by `sort_order` then `feature_key`.
- **Subtask B-FEAT-04.4:** Implement feature-by-key query with enabled filter.
- **Subtask B-FEAT-04.5:** Implement local environment demo seed insertion when catalog is empty.
- **Subtask B-FEAT-04.6:** Seed baseline features (`school`, `course`, `feed`) with route paths and capability requirements.

### Task B-FEAT-05 — Implement capability evaluation and DTO shaping
- **Subtask B-FEAT-05.1:** Parse per-feature `capability_requirements` from Mongo docs.
- **Subtask B-FEAT-05.2:** Implement permission match helper (`_has_any_permission`) with wildcard support.
- **Subtask B-FEAT-05.3:** Map access profile to `membershipState` and `roleKeys`.
- **Subtask B-FEAT-05.4:** Emit capability booleans (`canView`, `canJoin`, `canCreate`, `canManage`) in response DTO.

### Task B-FEAT-06 — Implement feature schema contracts
- **Subtask B-FEAT-06.1:** Define `FeatureCapabilities` schema with serialized camelCase aliases.
- **Subtask B-FEAT-06.2:** Define `FeaturePublic` schema with key metadata (`featureKey`, `sortOrder`, `routePath`, etc.).
- **Subtask B-FEAT-06.3:** Define `FeaturesListResponse` schema.

### Task B-FEAT-07 — Implement backend feature tests
- **Subtask B-FEAT-07.1:** Add authentication-required test for list route.
- **Subtask B-FEAT-07.2:** Add authentication-required test for detail route.
- **Subtask B-FEAT-07.3:** Add capability-shape response test with dependency overrides.
- **Subtask B-FEAT-07.4:** Include feature paths in OpenAPI route presence test set.

---

## 3. Frontend implemented tasks

### Task F-FEAT-01 — Implement features API client
- **Subtask F-FEAT-01.1:** Define feature DTO types aligned with backend (`featureKey`, `title`, `description`, `capabilities`, etc.).
- **Subtask F-FEAT-01.2:** Implement `fetchFeaturesList` (`GET /v1/features`).
- **Subtask F-FEAT-01.3:** Implement `fetchFeatureByKey` (`GET /v1/features/{featureKey}`).
- **Subtask F-FEAT-01.4:** Implement `fetchOrgFeaturesList` (`GET /v1/orgs/{orgId}/features`).
- **Subtask F-FEAT-01.5:** Implement `fetchOrgFeatureByKey` (`GET /v1/orgs/{orgId}/features/{featureKey}`).

### Task F-FEAT-02 — Implement features page data-query behavior
- **Subtask F-FEAT-02.1:** Add TanStack query for feature list with key `["features", "list"]`.
- **Subtask F-FEAT-02.2:** Gate query with auth readiness (`enabled: isReady && isAuthenticated`) to prevent unauthorized prefetch flicker.
- **Subtask F-FEAT-02.3:** Set controlled staleness (`staleTime: 60_000`) and disable retry for predictable auth/error behavior.

### Task F-FEAT-03 — Implement default catalog + backend merge strategy
- **Subtask F-FEAT-03.1:** Define full default 10-card feature catalog used as frontend baseline.
- **Subtask F-FEAT-03.2:** Build backend map by normalized `featureKey`.
- **Subtask F-FEAT-03.3:** Merge backend title/description/capability state over default metadata.
- **Subtask F-FEAT-03.4:** Compute availability (`disabled`) from backend `enabled && capabilities.canView`.
- **Subtask F-FEAT-03.5:** Generate stable card id/keys to avoid React key collisions.

### Task F-FEAT-04 — Implement features page UI rendering
- **Subtask F-FEAT-04.1:** Render hero header and descriptive intro copy.
- **Subtask F-FEAT-04.2:** Render responsive card grid with chip icons, title, description, and availability label.
- **Subtask F-FEAT-04.3:** Apply keyboard-accessible card interactions (`Enter` / `Space`).
- **Subtask F-FEAT-04.4:** Prevent interaction when card is marked unavailable.

### Task F-FEAT-05 — Implement workspace tab integration from Features page
- **Subtask F-FEAT-05.1:** Integrate `useFeatureTabs` to open/focus tabs from feature cards.
- **Subtask F-FEAT-05.2:** Render active workspace placeholder panel based on `?tab=` query.
- **Subtask F-FEAT-05.3:** Resolve active tab label from open tab state for display.

### Task F-FEAT-06 — Implement feature tabs context and persistence
- **Subtask F-FEAT-06.1:** Implement `FeatureTabsProvider` context API.
- **Subtask F-FEAT-06.2:** Persist open tabs in `sessionStorage`.
- **Subtask F-FEAT-06.3:** Implement tab open flow with label-to-slug conversion.
- **Subtask F-FEAT-06.4:** Implement special deep-link behavior for school tab (`/features/school`).
- **Subtask F-FEAT-06.5:** Implement tab removal and tab-ensure helpers.

### Task F-FEAT-07 — Implement module exports for feature surfaces
- **Subtask F-FEAT-07.1:** Export `FeaturesPageView` from module views index.
- **Subtask F-FEAT-07.2:** Export features API functions via module barrel (`src/modules/Features/index.ts`).

---

## 4. Not wired / not implemented (follow-up scope)

- **Gap 01:** No dedicated UI screen currently consumes `fetchFeatureByKey` detail API.
- **Gap 02:** No explicit org selector flow wiring `fetchOrgFeaturesList` / `fetchOrgFeatureByKey` in Features view.
- **Gap 03:** Backend capabilities for `canJoin`, `canCreate`, `canManage` are returned but frontend grid currently gates only `canView`.
- **Gap 04:** Workspace panel is a placeholder (“will load here”) and not yet connected to module-specific content loaders.
- **Gap 05:** No dedicated frontend unit/integration tests were found for `FeaturesPageView` merge/availability logic.
- **Gap 06:** No backend feature mutation endpoints (create/update/enable/disable catalog entries) in this implemented scope.

---

## 5. Quick file reference

| Area | Path |
|------|------|
| Backend feature routes | `deltalabs-backend/app/api/v1/features.py` |
| Backend feature service | `deltalabs-backend/app/domain/library/service.py` |
| Backend feature repository | `deltalabs-backend/app/domain/library/repository.py` |
| Backend feature schemas | `deltalabs-backend/app/domain/library/schemas.py` |
| Backend feature tests | `deltalabs-backend/tests/test_features_http.py` |
| Frontend feature API | `deltalabs-frontend/src/modules/Features/api/index.ts` |
| Frontend feature view | `deltalabs-frontend/src/modules/Features/views/FeaturesPageView.tsx` |
| Feature tabs context | `deltalabs-frontend/src/contexts/FeatureTabs_Context.tsx` |
| Frontend features module exports | `deltalabs-frontend/src/modules/Features/index.ts` |

---

*Generated from repository analysis for submission as a completed-work checklist. Keep section 4 as follow-up scope and sections 2–3 as delivered scope.*
