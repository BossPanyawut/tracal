import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/fx?**", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      base: "USD", quote: "THB", rate: 34, source: "Coinbase",
      referenceDate: "2026-01-01", fetchedAt: "2026-01-01T00:00:00.000Z", stale: false,
    }),
  }));
  await page.route("**/api/market?**", async (route) => {
    const gold = route.request().url().includes("type=gold");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(gold
        ? { type: "gold", symbol: "XAU", currency: "USD", unit: "troy_ounce", price: 2100, bid: 2099, ask: 2101, source: "GoldAPI", marketUpdatedAt: "2026-01-01T00:00:00.000Z", fetchedAt: "2026-01-01T00:00:00.000Z", stale: false }
        : { type: "crypto", symbol: "BTC", currency: "USD", price: 65000, source: "CoinGecko", marketUpdatedAt: "2026-01-01T00:00:00.000Z", fetchedAt: "2026-01-01T00:00:00.000Z", stale: false }),
    });
  });
});

test("crypto happy path uses Binance Spot default fees", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Quantity", { exact: true }).fill("0.1");
  await page.getByLabel("Buy price USD").fill("50000");
  await page.getByLabel("Sell price USD").fill("60000");
  await expect(page.getByTestId("profit-usd")).toHaveText("+$989.00");
  await expect(page.getByTestId("profit-thb")).toContainText("+฿33,626.00");
  await expect(page.getByTestId("roi")).toHaveText("+19.76%");
  await expect(page.getByText("Coinbase")).toBeVisible();
  await expect(page.getByText("CoinGecko")).toBeVisible();
});

test("gold gram happy path converts to one troy ounce", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Gold", exact: true }).click();
  await page.getByRole("button", { name: "Gram", exact: true }).click();
  await page.getByLabel("Quantity", { exact: true }).fill("31.1034768");
  await page.getByLabel("Buy price USD").fill("2000");
  await page.getByLabel("Sell price USD").fill("2100");
  await expect(page.getByTestId("profit-usd")).toHaveText("+$95.90");
  await expect(page.getByTestId("profit-thb")).toContainText("+฿3,260.60");
  await expect(page.getByText("GoldAPI")).toBeVisible();
});

test("manual FX remains usable on mobile", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Quantity", { exact: true }).fill("0.1");
  await page.getByLabel("Buy price USD").fill("50000");
  await page.getByLabel("Sell price USD").fill("60000");
  await page.getByRole("button", { name: "Manual FX" }).click();
  await page.getByLabel("Manual USD THB rate").fill("35");
  await expect(page.getByTestId("profit-thb")).toContainText("+฿34,615.00");
  await expect(page.getByLabel("Trading calculator")).toBeVisible();
});
