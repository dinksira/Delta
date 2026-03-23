# End-to-end tests (Playwright)

1. Install browsers once: `npx playwright install`
2. Start the app: `npm run dev` (or set `PLAYWRIGHT_BASE_URL` to a deployed preview)
3. Unskip tests in `smoke.spec.ts` when ready, then run: `npm run test:e2e`

CI should start a production or preview server before invoking Playwright.
