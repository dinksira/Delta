# School Module Implementation Details (Marketplace, Offers, My School)

## Purpose

This document records the current implementation of the School domain across backend and frontend, with focus on:

- School creation and membership projection (`/v1/schools`, `/v1/me/schools`)
- Offers lifecycle (partner ownership + marketplace transfer offers)
- Marketplace lifecycle (community feed, bids, listing owner controls, deal room)
- Architecture decisions, permission rules, and algorithms chosen during implementation

It is intended as an engineering reference for maintenance, onboarding, QA, and future extension.

---

## Scope Classification

### 1) School Core

- Create school in a me-centric flow
- Resolve/reuse or create owner workspace org
- Build school membership projection for `My School` and `Archive`

### 2) Offers Core

- Offer statuses: `requested`, `approved`, `amendment`, `rejected`
- Received/sent views
- Negotiation turn enforcement with amendment payload validation
- Partner invite offers generated during school creation

### 3) Marketplace

- Global community feed (`/v1/schools/marketplace`)
- Buy/bid flow built on top of `school_offers`
- Listing owner controls: edit, withdraw, delete
- Deal room offer triage (shortlist, unshortlist, accept, counter, reject)
- Ownership transfer and org reassignment on final approval

### 4) Shared UI Foundation

- Common `Table` component and first migration (`SchoolOffersTable`)
- Shared state panels for empty/error experiences across School pages
- Reusable header and action chips

---

## Domain Model (Conceptual)

### Organizations and Schools

- `orgs`: tenant boundary
- `org_memberships`: user membership in tenant
- `schools`: school entity (belongs to one `org_id`)
- `school_memberships`: school-scoped role map for user-to-school access

### Offers

- `school_offers`: canonical negotiation records
- Supports both:
  - ownership invite offers (school setup partner invites)
  - marketplace transfer offers (`offer_kind = "marketplace_transfer"`)

### Marketplace

- `school_marketplace`: listing records
- Listing status values: `active`, `under_offer`, `sold`, `withdrawn`

---

## Architecture Decisions

## Decision A: Offers is the core negotiation engine

**Decision:** Keep one offers engine and model marketplace negotiation as specialized offers (`offer_kind = "marketplace_transfer"`).

**Why:**

- Reuses existing status lifecycle and response mechanics
- Avoids duplicate negotiation stacks
- Allows a consistent audit and transition model

**Consequence:**

- UI must clearly distinguish normal partner offers vs marketplace transfer offers
- Some columns/actions are variant-specific (e.g., shortlist)

## Decision B: Global marketplace visibility

**Decision:** Marketplace discovery is global (`/v1/schools/marketplace`) rather than org-only.

**Why:** User requirement for community-wide feed and bidding.

**Consequence:** Listing owner actions in global mode must resolve source org server-side and enforce creator checks.

## Decision C: One active bid per listing per bidder

**Decision:** Block duplicate active bids from same user on same listing.

**Why:** Prevent noisy duplicate negotiations and ambiguous latest-offer behavior.

**Consequence:** Backend returns `marketplace_bid_already_exists` until previous active bid is resolved.

## Decision D: Shortlist is preference, not finalization

**Decision:** Shortlisting only marks preferred candidate; it does not auto-reject all other bids.

**Why:** Product requirement for parallel negotiation flexibility.

**Consequence:** Final transfer requires explicit `approved` action on shortlisted offer.

## Decision E: Transfer school to buyer’s org, never force seller org membership

**Decision:** On marketplace final approval, school and listing move to buyer’s resolved org (existing active org if any, else newly provisioned workspace org).

**Why:** Prevent cross-tenant contamination and enforce buyer ownership isolation.

**Consequence:** Buyer may auto-receive a new org + `org_owner` role if they had none.

## Decision F: Transaction fallback for standalone Mongo

**Decision:** Use transaction path when available; on Mongo `OperationFailure` code `20`, run non-transaction fallback.

**Why:** Local/dev standalone Mongo does not support transactions.

**Consequence:** Local acceptance flow remains functional without replica set.

---

## Backend Implementation (Classified)

### API routers

- `app/api/v1/schools.py`
  - Global marketplace routes (`/v1/schools/marketplace*`)
  - Org-scoped school + marketplace + offers routes (`/v1/orgs/{org_id}/schools*`)
  - Me-centric school create route (`POST /v1/schools`)
  - User-centric offers route (`GET /v1/schools/offers`)
- `app/api/v1/me.py`
  - `GET /v1/me/schools` membership projection

### Service layer

- `app/domain/school/service.py`
  - Business validation and policy checks
  - Actor/turn guards for offers
  - Owner-only listing operations
  - Marketplace bid/buy orchestration
  - Transfer-approval orchestration

### Repository layer

- `app/domain/school/repository.py`
  - Query/filter/sort/pagination for marketplace
  - Offer creation/list/update
  - Marketplace item CRUD
  - Shortlist/unshortlist persistence
  - Transactional transfer commit + fallback
  - Buyer-org resolve/create helper

---

## Key Algorithms and Rules

## 1) Me-centric school creation

`POST /v1/schools`:

1. Validate payload
2. If `targetOrgId` set -> require `school:manage` on that org
3. Else:
   - reuse first org where user is `org_owner`, or
   - create workspace org and assign owner
4. Create school
5. Upsert creator `school_membership` as `school_owner`
6. For partner rows with external email, create ownership offers (`offer_kind = "ownership"`)

## 2) Offer visibility (cross-org user view)

`GET /v1/schools/offers` uses user-centric query:

- `sent`: `sender_user_id == current_user`
- `received`: `recipient_email == current_user.email_normalized`
- optional `orgId` filter is supported server-side

Frontend `Offers` page now fetches with no org filter by default (`schoolQueryKeys.offers("all", ...)`) to avoid missed offers after account/org context switches.

## 3) Bid/Buy validation guard

Before creating marketplace transfer offer:

- listing must exist
- listing not `sold` / `withdrawn`
- buyer cannot be owner
- no existing active offer for same sender + listing
- buyer email must exist

On `buy`, listing is immediately set `under_offer` with bidder id.
On `bid`, offer is created with proposed price/currency/note.

## 4) Shortlist/unshortlist behavior

Shortlist:

- only for `offer_kind = marketplace_transfer`
- only when status is active (`requested` or `amendment`)
- only listing owner can shortlist
- unsets prior shortlisted row for same listing
- sets listing status to `under_offer` and current bidder

Unshortlist:

- only listing owner
- only if offer is currently shortlisted
- clears shortlist and returns listing to `active`

## 5) Offer status update with negotiation-turn enforcement

`update_offer_status`:

- enforces allowed transitions
- resolves expected actor from `negotiation_turn` + sender/recipient emails
- rejects unauthorized turn actions
- amendment requires `amendment_data`
- amendment flips `negotiation_turn`

Marketplace-specific override:

- for final `approved` on marketplace transfer, listing owner is allowed to finalize even if strict turn email differs (explicit owner-finalization rule).

## 6) Marketplace final approval -> ownership transfer

When approving shortlisted marketplace transfer:

- require shortlisted state
- resolve buyer org:
  - first active org membership if exists
  - else create new workspace org + membership + `org_owner` role binding
- set all current school memberships inactive
- set buyer school membership active + `school_owner`
- ensure buyer org membership active
- update `schools`:
  - `created_by_user_id = buyer`
  - `org_id = buyer_org_id`
- update listing:
  - `status = sold`
  - `bidder_user_id = buyer`
  - `org_id = buyer_org_id`

Execution mode:

- transactional when supported
- fallback sequential commit path on standalone Mongo (`OperationFailure` code 20)

## 7) Marketplace Bid Decision Architecture (explicit governance)

This section defines the bid-specific control model and limits that should be treated as product and engineering source-of-truth.

### 7.1 Bid eligibility rules

A user can place a marketplace bid only when all conditions hold:

- listing exists
- listing status is not `sold` and not `withdrawn`
- bidder is not the listing owner
- bidder account has a valid email
- bidder has no other active bid for the same listing

If any condition fails, backend returns a hard validation/permission error and does not create an offer row.

### 7.2 Duplicate-bid limitation (one-active-bid policy)

For each `(listing_id, sender_user_id)` pair:

- max **one active** bid offer at a time (`requested` or `amendment`)
- new bid attempts are blocked with `marketplace_bid_already_exists`
- bidder must resolve current active bid (reject path, approval path, or withdrawal) before creating another

This was chosen to avoid negotiation fragmentation and conflicting latest-price semantics.

### 7.3 Decision rights matrix

- **Bidder can:**
  - place bid
  - withdraw own active bid
  - respond to counter when it is their negotiation turn
- **Listing owner can:**
  - shortlist/unshortlist marketplace offers on own listing
  - accept/reject/counter per negotiation-turn and owner-finalization rule
  - finalize shortlisted marketplace transfer approval
- **Non-participants cannot:**
  - mutate bid state
  - open seller deal-room actions for listing they do not own

### 7.4 Shortlist decision semantics

- shortlist is a **preference marker**, not closure
- exactly one shortlisted offer per listing at a time
- shortlisting one offer does **not** reject other active offers
- only shortlisted offer is eligible for final transfer approval

### 7.5 Withdrawal behavior

Bid withdrawal is allowed only when:

- requester is the original bidder (`sender_user_id`)
- bid status is active (`requested` or `amendment`)
- offer kind is marketplace transfer

Implementation effect:

- offer status set to `rejected` with note marker `withdrawn_by_bidder`
- if listing currently points at that bidder, listing status resets to `active`

### 7.6 Listing lifecycle interplay with bid decisions

- New buy action sets listing to `under_offer` immediately
- Shortlist also sets listing to `under_offer` with shortlisted bidder context
- Unshortlist can return listing to `active`
- Final approved transfer sets listing to `sold`
- Withdrawn/sold listings reject new bids

### 7.7 Safety and consistency constraints

- backend is source-of-truth for all bid-state transitions
- frontend action availability is advisory; backend re-validates every mutation
- transfer commit requires shortlisted marketplace offer guard
- transaction path preferred; fallback path preserves correctness in standalone Mongo dev

### 7.8 Implemented bid limits

- bid cooldown: enforced per `(listing_id, sender_user_id)` between consecutive submissions
- bid expiry timer: marketplace bid offers are created with expiry timestamp and blocked when expired
- max amendment rounds: marketplace amendment rounds are capped
- rate limit: max marketplace bid creations per bidder within a rolling window
- all four limits are runtime-configurable via backend environment settings:
  - `MARKETPLACE_BID_COOLDOWN_SECONDS`
  - `MARKETPLACE_BID_EXPIRY_HOURS`
  - `MARKETPLACE_MAX_AMENDMENT_ROUNDS`
  - `MARKETPLACE_BID_RATE_LIMIT_WINDOW_SECONDS`
  - `MARKETPLACE_BID_RATE_LIMIT_MAX_CREATES`

### 7.9 Future hardening candidates

- background sweeper job for proactive expiry state transitions (not only on action attempts)
- optional minimum increment/decrement constraints for counter economics
- adaptive anti-spam heuristics (IP/device/risk-score aware limits)

---

## Frontend Implementation (Classified)

### Primary views

- `SchoolHomeView` (`My School`)
  - membership-based school cards
  - common error/empty state panel
- `SchoolArchiveView`
  - membership-based archived schools and restore
  - now has working Add School header navigation
- `SchoolOffersView`
  - received/sent + status tabs
  - cross-org user-centric offer query
  - variant-based offers table usage (`variant="offers"`)
  - common error/empty states
  - now has working Add School header navigation
- `SchoolMarketplaceView`
  - community/bids/listings tabs
  - filters, sorting, pagination in URL query params
  - listing create/edit/withdraw/delete owner flow
  - buyer bid/buy + withdraw bid flow
  - in-page bid review and seller deal room actions
  - deal room table migrated to common `Table`

### Shared components

- `components/theme/Table.tsx`
  - reusable typed table engine
  - compact density mode, alignment, alternating row backgrounds
- `SchoolOffersTable.tsx`
  - now supports `variant: "offers" | "marketplace"`
  - shortlist column rendered only in marketplace variant
- `SchoolStatePanel.tsx`
  - consistent empty/error panel used across School pages
- `SchoolWorkspaceHeader.tsx`
  - add-school behavior via `addSchoolHref` or callback
  - bug source identified: pages without these props rendered inert Add School button

### UX-specific decisions implemented

- Marketplace and Offers include explanatory copy to avoid conceptual confusion.
- `Track only` is shown when action is not allowed for current row state.
- Action chips now use pointer cursor for hover affordance.

---

## API Surface Summary

### User-centric

- `GET /v1/me/schools`
- `GET /v1/schools/offers`
- `POST /v1/schools`

### Global marketplace

- `GET /v1/schools/marketplace`
- `GET /v1/schools/marketplace/{listing_id}`
- `POST /v1/schools/marketplace/buy`
- `POST /v1/schools/marketplace/bid`
- `POST /v1/schools/marketplace/bids/{offer_id}/withdraw`
- `PATCH /v1/schools/marketplace/{listing_id}`
- `POST /v1/schools/marketplace/{listing_id}/withdraw`
- `DELETE /v1/schools/marketplace/{listing_id}`

### Org-scoped

- `GET/POST /v1/orgs/{org_id}/schools`
- `PATCH /v1/orgs/{org_id}/schools/{school_id}/archive`
- `GET /v1/orgs/{org_id}/schools/marketplace`
- `POST /v1/orgs/{org_id}/schools/marketplace`
- `PATCH /v1/orgs/{org_id}/schools/marketplace/{listing_id}`
- `POST /v1/orgs/{org_id}/schools/marketplace/{listing_id}/withdraw`
- `DELETE /v1/orgs/{org_id}/schools/marketplace/{listing_id}`
- `POST /v1/orgs/{org_id}/schools/marketplace/buy`
- `POST /v1/orgs/{org_id}/schools/marketplace/bid`
- `GET /v1/orgs/{org_id}/schools/marketplace/{listing_id}/offers`
- `GET /v1/orgs/{org_id}/schools/offers`
- `POST /v1/orgs/{org_id}/schools/offers`
- `PATCH /v1/orgs/{org_id}/schools/offers/{offer_id}/status`
- `POST /v1/orgs/{org_id}/schools/offers/{offer_id}/shortlist`
- `POST /v1/orgs/{org_id}/schools/offers/{offer_id}/unshortlist`

---

## Permission and Actor Matrix (Current)

- Listing CRUD (`update/withdraw/delete`): listing creator only
- Deal room read: listing creator only
- Shortlist/unshortlist: listing creator only, marketplace offers only
- Bid withdraw: bidder only, active bid statuses only
- Offer status update:
  - normal path: current negotiation-turn actor email
  - marketplace final approval: listing owner can finalize shortlisted transfer

---

## Query and Cache Behavior

### Keys

- `schoolQueryKeys.mySchools(userId?)`
- `schoolQueryKeys.offers(orgOrScope, status, view)`
- `schoolQueryKeys.marketplace(orgId, view, filters...)`

### Important fixes

- School create success now invalidates and refetches user-school prefixes (`["school","me","schools"]`) before navigation to avoid manual refresh.
- Offers page uses `"all"` scope key and no org filter by default to avoid hidden partner offers caused by active-org mismatch.

---

## Testing and Verification

### Backend tests added/updated

- `tests/test_me_http.py` for `/v1/me/schools` contract/auth presence
- `tests/test_schools_me_http.py` for `/v1/schools` contract/auth presence
- `tests/unit/test_school_service.py` expanded with:
  - listing owner update/withdraw/delete rules
  - shortlist behavior (switching shortlisted without auto-rejecting others)
  - marketplace transfer owner finalization rule
  - delete blocked when listing has offers

### Frontend verification used

- Type safety: `npm run typecheck`
- Lint diagnostics on edited files
- Manual behavior checks through the School module pages

---

## Known UX Semantics (for Product/Support)

- `Shortlist` = preferred candidate marker for marketplace transfer offers only
- `Approve` in Offers means finalize this offer transition (subject to rules)
- `Track only` means action is intentionally unavailable for that row/state
- Offers and Marketplace are related but not identical:
  - Offers = core negotiation module
  - Marketplace = listing/discovery and deal-room workflow built on offer engine

---

## Files of Record (High Impact)

### Backend

- `deltalabs-backend/app/api/v1/schools.py`
- `deltalabs-backend/app/api/v1/me.py`
- `deltalabs-backend/app/domain/school/service.py`
- `deltalabs-backend/app/domain/school/repository.py`
- `deltalabs-backend/app/domain/school/schemas.py`

### Frontend

- `deltalabs-frontend/src/modules/School/views/SchoolMarketplaceView.tsx`
- `deltalabs-frontend/src/modules/School/views/SchoolOffersView.tsx`
- `deltalabs-frontend/src/modules/School/views/SchoolHomeView.tsx`
- `deltalabs-frontend/src/modules/School/views/SchoolArchiveView.tsx`
- `deltalabs-frontend/src/modules/School/views/SchoolCreatePageView.tsx`
- `deltalabs-frontend/src/components/features/school/master/SchoolOffersTable.tsx`
- `deltalabs-frontend/src/components/theme/Table.tsx`
- `deltalabs-frontend/src/components/features/school/master/SchoolStatePanel.tsx`
- `deltalabs-frontend/src/modules/School/api/index.ts`
- `deltalabs-frontend/src/modules/School/hooks/schoolQueryKeys.ts`

---

## Future Extension Notes

- Introduce explicit audit event stream for every sensitive transition
- Add richer offer-state timeline and actor reason capture in UI
- Add feature flags for progressive rollout of table variants
- Expand integration tests around full marketplace close/transfer path
- Add formal API docs page generated from OpenAPI for School module

