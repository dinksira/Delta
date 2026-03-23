import { test } from "@playwright/test";

test.describe.skip("Smoke (unskip when Playwright runs against a live dev server or preview URL)", () => {
  test("loads the public landing page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("heading", { level: 1 }).waitFor({ state: "visible" });
  });
});
