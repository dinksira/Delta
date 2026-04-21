# School Marketplace Phased Implementation Plan

## Objective

Build a real, reliable School Marketplace platform (buy/sell schools, bidding, negotiation, ownership transfer, contracts, and compliance) in phases, while finishing high-priority foundational work first.

---

## Current Reality (Important)

Before deep marketplace phases, we must fully complete and harden:

1. School creation flow (wizard + backend validation + persistence correctness)
2. Offer lifecycle baseline (requested/approved/amendment/rejected with strict transitions)
3. Core authorization and audit logging for school actions

These are prerequisites for all advanced marketplace workflows.

---

## Delivery Principles

- Module-first implementation (`src/modules/School`, backend `app/domain/school`)
- Thin route pages, logic in hooks/services
- Strict DTO contracts and validation
- State machine-driven backend transitions (no implicit status jumps)
- Idempotent write APIs where retries can happen
- Every critical phase includes:
  - API contracts
  - UI/UX screens
  - authorization model
  - audit events
  - tests (unit/integration/e2e)

---

## Pre-Phase A (Foundation Hardening)

### A1. School Creation Completion
- Finalize all wizard fields and required validations
- Server-side validation parity with frontend
- Attachments/document metadata correctness
- Recovery/edit draft support
- Error banners with actionable messages

### A2. Offer Baseline Completion
- Enforce strict status transitions:
  - requested -> approved/amendment/rejected
  - amendment -> approved/rejected
- Add transition reason fields
- Add actor + timestamp audit trail

### A3. Platform Safety Baseline
- Add audit event records for create/update/archive/listing actions
- Add role checks for each endpoint (`school:manage`, `school:read`, marketplace roles)
- Add optimistic concurrency (`updated_at` checks or version field)

### A4. Testing Baseline
- Backend integration tests for School + Offer APIs
- Frontend e2e for create school and offer approval/rejection

Exit criteria: school creation and offer flows are stable, tested, and production-safe.

---

## Phase 1: Core Marketplace v1

### Scope
- Listing CRUD (create, update, archive/unlist, relist)
- Listing search/filter/sort
- Listing details page
- Real bid submission
- Seller bid decisions (accept/reject/counter entry point)

### Backend
- Collections:
  - `school_marketplace_listings`
  - `school_marketplace_bids`
  - `school_marketplace_audit`
- Endpoints (org scoped):
  - `POST /orgs/{org_id}/schools/marketplace/listings`
  - `GET /orgs/{org_id}/schools/marketplace/listings`
  - `GET /orgs/{org_id}/schools/marketplace/listings/{listing_id}`
  - `PATCH /orgs/{org_id}/schools/marketplace/listings/{listing_id}`
  - `POST /orgs/{org_id}/schools/marketplace/listings/{listing_id}/archive`
  - `POST /orgs/{org_id}/schools/marketplace/listings/{listing_id}/bids`
  - `GET /orgs/{org_id}/schools/marketplace/listings/{listing_id}/bids`
  - `POST /orgs/{org_id}/schools/marketplace/bids/{bid_id}/decision`

### Frontend
- Screens:
  - Marketplace listing grid (community)
  - My Listings (seller)
  - My Bids (buyer)
  - Listing detail view
  - Create/Edit listing flow
- Filters:
  - school type, region, asking range, status, recent activity
- Components:
  - listing cards (community / listing / bid variants)
  - bid drawer/modal
  - decision action controls

### Rules
- Bid amount must be validated on backend
- Closed/archived listing cannot accept new bids
- Bid history immutable (append-only events)

Exit criteria: users can list schools, discover listings, place bids, and receive seller decisions.

---

## Phase 2: Negotiation + Offer Engine

### Scope
- Counter-offers
- Offer expiry windows
- Negotiation thread
- Strict state machine transitions

### Backend
- Introduce deal-offer engine:
  - `offer_state`: draft, submitted, countered, accepted, rejected, expired, withdrawn
- Enforce transition guardrails:
  - only valid transitions accepted
  - unauthorized actor transition blocked
- Expiry daemon/job:
  - auto-mark offers expired
  - notify participants

### Frontend
- Screens:
  - Negotiation timeline
  - Counter-offer form
  - Offer expiry indicators + timers
- UX:
  - clear current state + next allowed actions
  - reason capture on reject/withdraw

Exit criteria: end users can negotiate through controlled counter-offer cycles with expiry rules.

---

## Phase 3: Deal Room

### Scope
- Secure deal workspace per accepted negotiation
- Document repository
- Participant messaging/comments
- Checklist tasks with owners and due dates

### Backend
- Entities:
  - `deal_rooms`
  - `deal_documents`
  - `deal_comments`
  - `deal_tasks`
- Access model:
  - room participants only
  - role-based actions (buyer/seller/legal/admin)

### Frontend
- Screens:
  - Deal room overview
  - Documents tab
  - Comments/activity tab
  - Tasks/checklist tab
- Features:
  - upload/version docs
  - mention/comments
  - task completion workflow

Exit criteria: accepted deals move into collaborative, secure execution workspace.

---

## Phase 4: Contract + Closing

### Scope
- Agreement lifecycle states
- Signature workflow integration
- Ownership transfer workflow
- Closing confirmation and post-close state

### Backend
- Agreement states:
  - draft, under_review, awaiting_signature, signed, closed, failed
- Ownership transfer engine:
  - validates partner percentages and transfer approvals
  - records ownership ledger changes

### Frontend
- Screens:
  - Contract summary and status tracker
  - Signature status view
  - Ownership transfer review
  - Closing confirmation page

Exit criteria: deal can legally and operationally close with recorded ownership transfer.

---

## Phase 5: Compliance + Finance

### Scope
- KYB/KYC checkpoints
- Escrow milestones
- Compliance audit tooling
- Risk and exception handling

### Backend
- Verification models:
  - identity/business verification statuses
- Escrow model:
  - milestone schedule and state
- Compliance events:
  - all sensitive actions are auditable and queryable

### Frontend
- Screens:
  - Compliance review dashboard
  - Verification checklist
  - Escrow milestone tracker
  - Risk flags and manual review queue

Exit criteria: marketplace is enterprise-grade for regulated, high-value transactions.

---

## Cross-Phase Non-Functional Requirements

- Security:
  - strict RBAC, scoped permissions, participant isolation
- Reliability:
  - idempotency keys, retries, dead-letter handling where async jobs exist
- Observability:
  - structured logs, metrics, alerting for deal failures
- Data governance:
  - immutable audit trails, soft-delete where required
- Performance:
  - pagination, indexed queries, query budgets

---

## Suggested Execution Order (Now)

1. Finish Pre-Phase A (school creation + offers hardening)
2. Build Phase 1 (Core Marketplace v1)
3. Validate in staging with realistic user journeys
4. Continue to Phase 2 and beyond

---

## Immediate Backlog (Next 2 Sprints)

### Sprint M1
- Complete remaining school creation hardening and tests
- Offer transition constraints + audit history
- Listing CRUD backend contracts finalized
- Community/My Listings/My Bids with real filtering + pagination

### Sprint M2
- Listing detail page + bid drawer
- Bid decision API + UI
- Event timeline and notification hooks
- e2e coverage for create listing -> bid -> decision

---

## Notes

- The 3 provided marketplace screens are a good starting visual baseline for Phase 1 tabs.
- They are not enough for full real-marketplace operations; additional detail screens and process flows are required.
- This plan is intentionally phased to avoid unstable big-bang implementation.

