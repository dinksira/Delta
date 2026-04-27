# End-to-end tests (Playwright)

## Current Coverage

- `school-marketplace-flow.spec.ts`
  - Covers: create listing -> bid -> shortlist -> approve -> sold
  - Uses deterministic API route mocking so the flow is stable and not blocked by backend fixtures.
- `smoke.spec.ts`
  - Optional baseline smoke check (currently skipped by default).

## Run Locally

1. Install browsers once: `npx playwright install`
2. Start the app: `npm run dev` (or set `PLAYWRIGHT_BASE_URL` to a deployed preview)
3. Run all e2e tests: `npm run test:e2e`
4. Run only marketplace journey: `npx playwright test e2e/school-marketplace-flow.spec.ts`

CI should start a production or preview server before invoking Playwright.
