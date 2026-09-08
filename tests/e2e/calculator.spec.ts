import { expect, test, type Page } from "@playwright/test";
const fx = (rate = 33) => ({ base: "USD", quote: "THB", rate, source: "Coinbase", referenceDate: "2026-01-01", fetchedAt: "2026-01-01T00:00:00.000Z", stale: false });
test.beforeEach(async ({ page }) => {
  await page.route("**/api/fx?**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(fx()) }));
  await page.route("**/api/market?**", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { manualInputAllowed: true } }) }));
});
async function fill(page: Page) {
  await page.getByLabel("Capital THB", { exact: true }).fill("3300");
  await page.getByLabel("Buy price USD", { exact: true }).fill("1");
  await page.getByLabel("Sell price USD", { exact: true }).fill("2");
  await page.getByLabel("Buy FX rate").fill("33"); await page.getByLabel("Sell FX rate").fill("33");
}
test("home separates planning, journal and widget into clear destinations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "แต่ละงานมีพื้นที่ของตัวเอง" })).toBeVisible();
  await expect(page.getByLabel("Trading calculator")).toHaveCount(0);
  await page.getByRole("link", { name: "เปิดเครื่องคำนวณ" }).click();
  await expect(page).toHaveURL(/\/calculator$/);
  await expect(page.getByRole("heading", { name: "คำนวณและบันทึกแผน", exact: true })).toBeVisible();
  await page.goto("/#journal");
  await expect(page).toHaveURL(/\/journal$/);
});
test("same-FX fees and sensitivity work", async ({ page }) => {
  await page.goto("/calculator"); await fill(page);
  await expect(page.getByTestId("profit-usd")).toHaveText("+$99.60");
  await expect(page.getByTestId("quantity")).toContainText("99.9000999");
  await expect(page.getByTestId("roi")).toHaveText("+99.60%");
  await expect(page.getByTestId("sensitivity").getByText("$1.80")).toBeVisible();
});
test("USD profit and THB loss with distinct rates", async ({ page }) => {
  await page.goto("/calculator");
  for (const [label, value] of [["Capital THB","35000"],["Buy price USD","1000"],["Sell price USD","1100"],["Buy FX rate","35"],["Sell FX rate","31"],["ค่าธรรมเนียมซื้อ","0"],["ค่าธรรมเนียมขาย","0"]]) await page.getByLabel(label, { exact: true }).fill(value);
  await expect(page.getByTestId("profit-usd")).toHaveText("+$100.00"); await expect(page.getByTestId("profit-thb")).toHaveText("-฿900.00");
  await expect(page.getByTestId("roi")).toHaveText("-2.57%");
  await page.getByLabel("Target profit THB").fill("0"); await expect(page.getByTestId("required-price")).toContainText("$1,129.03");
});
test("manual calculation works with unavailable providers and ref refresh does not overwrite", async ({ page }) => {
  await page.route("**/api/fx?**", (route) => route.fulfill({ status: 503, body: "{}" }));
  await page.goto("/calculator"); await fill(page); await expect(page.getByTestId("profit-thb")).toBeVisible();
  await page.route("**/api/fx?**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(fx(40)) }));
  await page.getByRole("button", { name: "รีเฟรชอ้างอิง" }).click();
  await expect(page.getByLabel("Buy FX rate")).toHaveValue("33"); await expect(page.getByLabel("Sell FX rate")).toHaveValue("33");
  await page.getByRole("button", { name: "ใช้อ้างอิงขาขาย", exact: true }).click(); await expect(page.getByLabel("Sell FX rate")).toHaveValue("40");
});
test("saved plan restores immutable applied FX, duplicates and backs up", async ({ page }) => {
  await page.goto("/calculator"); await fill(page); await page.getByLabel("ชื่อแผน", { exact: true }).fill("Plan A"); await page.getByRole("button", { name: "บันทึกแผน", exact: true }).click();
  await expect(page.getByText("บันทึกแผนแล้ว", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "ทำสำเนา", exact: true }).click();
  await expect(page.getByRole("button", { name: /Plan A ·|Plan A BTC/ })).toHaveCount(2);
  const backupEvent = page.waitForEvent("download"); await page.getByRole("button", { name: "สำรอง JSON", exact: true }).click(); const backup = await backupEvent; expect(backup.suggestedFilename()).toBe("tracal-plans.json");
  await page.route("**/api/fx?**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(fx(40)) }));
  await page.reload(); await expect(page.getByLabel("Buy FX rate")).toHaveValue("33"); await expect(page.getByTestId("profit-usd")).toHaveText("+$99.60");
});
test("JSON import validates and previews without destroying saved plans", async ({ page }) => {
  await page.goto("/calculator"); await fill(page); await page.getByLabel("ชื่อแผน", { exact: true }).fill("Backup plan"); await page.getByRole("button", { name: "บันทึกแผน", exact: true }).click();
  const downloadEvent = page.waitForEvent("download"); await page.getByRole("button", { name: "สำรอง JSON", exact: true }).click(); const download = await downloadEvent;
  const path = await download.path(); if (!path) throw new Error("No backup file");
  await page.getByLabel("นำเข้า JSON", { exact: true }).setInputFiles(path); await expect(page.getByText(/พร้อมเพิ่ม 1 แผน/)).toBeVisible();
  await page.getByRole("button", { name: "ยืนยันนำเข้าแผน" }).click(); await expect(page.getByRole("button", { name: /Backup plan BTC/ })).toHaveCount(2);
  await page.getByLabel("นำเข้า JSON", { exact: true }).setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from('{"version":99}') });
  await expect(page.getByText(/ไฟล์สำรองไม่ถูกต้อง/)).toBeVisible(); await expect(page.getByRole("button", { name: /Backup plan BTC/ })).toHaveCount(2);
});
test("risk sizing can be applied and an incomplete target never crashes", async ({ page }) => {
  await page.goto("/calculator");
  for (const [label,value] of [["Buy price USD","100"],["Buy FX rate","35"],["Sell FX rate","35"],["ค่าธรรมเนียมซื้อ","0"],["ค่าธรรมเนียมขาย","0"],["Stop price","90"],["Risk budget THB","700"],["Max capital THB","10000"]]) await page.getByLabel(label, { exact: true }).fill(value);
  await expect(page.getByTestId("risk-result")).toContainText("฿7,000.00"); await page.getByLabel("Target profit THB").fill("-");
  await expect(page.getByLabel("Trading calculator")).toBeVisible(); await page.getByLabel("Target profit THB").fill("0");
  await page.getByRole("button", { name: "ใช้เงินทุนจากแผนขาดทุน" }).click(); await expect(page.getByLabel("Capital THB", { exact: true })).toHaveValue("7000");
});
test("USDT is manual and gold units use troy ounces", async ({ page }) => {
  await page.goto("/calculator"); await fill(page);
  await page.getByLabel("สกุลราคาซื้อขาย", { exact: true }).selectOption("USDT"); await expect(page.getByLabel("Buy FX rate")).toHaveValue(""); await expect(page.getByRole("button", { name: "ใช้อ้างอิงทั้งสองขา" })).toHaveCount(0);
  await page.getByLabel("สินทรัพย์", { exact: true }).selectOption("XAU");
  for (const [label,value] of [["Capital THB","35000"],["Buy price USD","1000"],["Sell price USD","1100"],["Buy FX rate","35"],["Sell FX rate","35"],["ค่าธรรมเนียมซื้อ","0"],["ค่าธรรมเนียมขาย","0"]]) await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByLabel("หน่วยทอง").selectOption("g"); await expect(page.getByTestId("quantity")).toContainText("31.10347680");
  await page.getByRole("button", { name: "ดูราคาอ้างอิง", exact: true }).click(); await expect(page.getByText(/ดึงราคาทองไม่ได้/)).toBeVisible(); await expect(page.getByTestId("profit-thb")).toHaveText("+฿3,500.00");
});
test("market quote applies only after explicit action", async ({ page }) => {
  await page.route("**/api/market?**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ symbol: "BTC", currency: "USD", price: "123", unit: "unit", source: "Coinbase spot", marketUpdatedAt: null, fetchedAt: "2026-09-07T00:00:00.000Z", stale: false }) }));
  await page.goto("/calculator"); await fill(page); await page.getByRole("button", { name: "ดูราคาอ้างอิง", exact: true }).click();
  await expect(page.getByLabel("Sell price USD")).toHaveValue("2"); await page.getByRole("button", { name: "ใช้ราคานี้เป็นราคาขาย" }).click(); await expect(page.getByLabel("Sell price USD")).toHaveValue("123");
});
test("journal multiple entries and partial sale survive reload", async ({ page }) => {
  await page.goto("/journal");
  async function add(date: string, side: string, qty: string, price: string, rate: string) {
    await page.getByLabel("วันเวลารายการ").fill(date); await page.getByLabel("ด้านรายการ").selectOption(side);
    await page.getByLabel("จำนวนรายการ", { exact: true }).fill(qty); await page.getByLabel("ราคารายการ", { exact: true }).fill(price); await page.getByLabel("เรตรายการ", { exact: true }).fill(rate); await page.getByRole("button", { name: "เพิ่มรายการ", exact: true }).click();
  }
  await add("2026-09-01T12:00", "buy", "1", "100", "35"); await add("2026-09-02T12:00", "buy", "1", "200", "30"); await add("2026-09-03T12:00", "sell", "0.5", "300", "32");
  await expect(page.getByTestId("journal-quantity")).toHaveText("1.50000000"); await expect(page.getByTestId("journal-realized")).toHaveText("+฿2,425.00");
  await page.reload(); await expect(page.getByTestId("journal-quantity")).toHaveText("1.50000000");
});
test("CSV preview, duplicate detection and bad rows", async ({ page }) => {
  await page.goto("/journal"); await page.getByText("นำเข้าและสำรอง CSV", { exact: true }).click();
  const csv = "id,occurredAt,asset,quoteCurrency,side,quantity,price,feeQuote,fx,extraCostThb\nrow1,2026-09-01T00:00:00.000Z,BTC,USD,buy,1,100,0,35,0";
  const file = { name: "test.csv", mimeType: "text/csv", buffer: Buffer.from(csv) };
  await page.getByLabel("นำเข้า CSV", { exact: true }).setInputFiles(file); await expect(page.getByText(/อ่านได้ 1 รายการ/)).toBeVisible(); await page.getByRole("button", { name: "ยืนยันนำเข้า CSV" }).click();
  await expect(page.getByTestId("journal-quantity")).toHaveText("1.00000000");
  await page.getByLabel("นำเข้า CSV", { exact: true }).setInputFiles(file); await page.getByRole("button", { name: "ยืนยันนำเข้า CSV" }).click(); await expect(page.getByText("นำเข้าแล้ว ข้ามรายการซ้ำ 1 รายการ", { exact: true })).toBeVisible();
  await page.getByLabel("นำเข้า CSV", { exact: true }).setInputFiles({ ...file, buffer: Buffer.from(csv.replace(",buy,1,", ",buy,-1,")) }); await expect(page.getByRole("button", { name: "ยืนยันนำเข้า CSV" })).toBeDisabled();
});
test("widget validates branding and remains a working isolated calculator", async ({ page }) => {
  await page.goto("/widget"); await page.getByLabel("ชื่อแบรนด์").fill("My trade desk"); await page.getByRole("button", { name: "ดูตัวอย่าง", exact: true }).click();
  await expect(page.getByLabel("โค้ด iframe")).toContainText("brand=My+trade+desk");
  const frame = page.frameLocator('iframe[title="ตัวอย่างเครื่องคำนวณ"]'); await expect(frame.getByRole("heading", { name: "My trade desk" })).toBeVisible();
  await expect(frame.getByText(/แหล่งข้อมูล Coinbase/)).toBeVisible();
  await frame.getByLabel("Capital THB", { exact: true }).fill("3300"); await frame.getByLabel("Buy price USD").fill("1"); await frame.getByLabel("Sell price USD").fill("2"); await frame.getByLabel("Buy FX rate").fill("33"); await frame.getByLabel("Sell FX rate").fill("33");
  await expect(frame.getByLabel("Capital THB", { exact: true })).toHaveValue("3300"); await expect(frame.getByLabel("Buy price USD")).toHaveValue("1"); await expect(frame.getByLabel("Sell price USD")).toHaveValue("2");
  await expect(frame.getByTestId("profit-usd")).toHaveText("+$99.60");
  await expect(frame.getByLabel("แผนที่บันทึก")).toHaveCount(0);
  await page.goto("/embed?accent=not-a-color"); await expect(page.getByRole("heading", { name: "ตั้งค่า widget ไม่ถูกต้อง" })).toBeVisible();
});
