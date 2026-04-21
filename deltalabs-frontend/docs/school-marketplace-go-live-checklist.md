# School Marketplace Go-Live Checklist (DeltaLabs)

This checklist reflects the current implementation status and what still needs to close before production go-live.

## Status Legend

- `done`: implemented and validated in code/tests
- `partial`: implemented in part, but missing depth/reliability
- `missing`: not yet implemented

## Readiness Checklist

- `done` Core marketplace APIs exist (`list/create/buy/bid/offers/shortlist/unshortlist/decision`).
- `done` Marketplace UI flows exist (`Community`, `My Bids`, `My Listings`, listing create, bid modal, deal room actions).
- `done` Backend service-level tests cover strict offer transitions and transfer approval invariants.
- `partial` Listing discovery depth (server-side filtering/sorting/pagination and dedicated listing details route) is not fully complete.
- `partial` Deal room depth is basic (offer table + actions) and lacks richer workflow artifacts (documents/tasks/thread).
- `partial` Contracts/closing workflow is represented by offer acceptance transfer logic, but no explicit contract lifecycle module.
- `missing` Compliance and finance phase capabilities (KYB/KYC, escrow milestones, compliance dashboards).
- `partial` Frontend e2e automation existed only as skipped smoke tests; full journey coverage is being added now.

## Go-Live Gate (Must Pass)

- Marketplace happy path e2e passes: create listing -> bid -> shortlist -> approve -> listing sold.
- Marketplace negative path e2e passes: reject flow returns listing to active availability.
- Backend tests pass for transition guards, shortlist invariants, and concurrent approval protection.
- Auth + org scoping is validated in UI and API for all marketplace actions.
- Error handling UX is verified for failed create/bid/approve actions (user-facing actionable messages).

## Immediate Next Slice (Execution Order)

1. Finalize and run deterministic frontend e2e journey tests.
2. Add backend + frontend contracts for listing filters/pagination/detail view.
3. Add deal room v2 artifacts (activity timeline, document checklist stubs, audit surface).
4. Introduce contract/closing domain model (states + API skeleton + guarded transitions).
5. Add compliance baseline stubs (KYB/KYC status model + audit hooks) behind feature flags.
