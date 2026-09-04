import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/fx?**", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      base: "USD", quote: "THB", rate: 33, source: "Coinbase",
      referenceDate: "2026-01-01", fetchedAt: "2026-01-01T00:00:00.000Z", stale: false,
    }),
  }));
});

test("THB capital and per-unit prices produce a profit", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Capital THB").fill("3300");
  await page.getByLabel("Buy price USD").fill("1");
  await page.getByLabel("Sell price USD").fill("2");
  await expect(page.getByTestId("profit-usd")).toHaveText("+$99.60");
  await expect(page.getByTestId("quantity")).toContainText("99.9000999");
  await expect(page.getByTestId("roi")).toHaveText("+99.60%");
});

test("shows a loss below the break-even price", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Capital THB").fill("3300");
  await page.getByLabel("Buy price USD").fill("1");
  await page.getByLabel("Sell price USD").fill("0.8");
  await expect(page.getByText("ขาดทุน", { exact: true })).toBeVisible();
});

test("shows the profit ladder and answers a target profit", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Capital THB").fill("3300");
  await page.getByLabel("Buy price USD").fill("1");
  await page.getByLabel("Sell price USD").fill("2");
  const ladder = page.getByTestId("sensitivity");
  await expect(ladder).toBeVisible();
  await expect(ladder.getByText("$1.80")).toBeVisible();
  await page.getByLabel("Target profit THB").fill("3300");
  await expect(page.getByTestId("required-price")).toContainText("$2.00");
});

test("keeps the inputs after a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Capital THB").fill("3300");
  await page.getByLabel("Buy price USD").fill("1");
  await page.getByLabel("Sell price USD").fill("2");
  await expect(page.getByTestId("profit-thb")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Capital THB")).toHaveValue("3300");
  await expect(page.getByTestId("profit-thb")).toBeVisible();
});

test("calculator remains usable on mobile", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Capital THB").fill("3300");
  await page.getByLabel("Buy price USD").fill("1");
  await page.getByLabel("Sell price USD").fill("2");
  await expect(page.getByTestId("profit-thb")).toBeVisible();
  await expect(page.getByLabel("Trading calculator")).toBeVisible();
});
