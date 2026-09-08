// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { GET } from "@/app/api/market/route";
import { clearMarketCacheForTests } from "@/lib/providers/market";
import { clearRateLimitsForTests } from "@/lib/http/rateLimit";
beforeEach(() => { clearMarketCacheForTests(); clearRateLimitsForTests(); vi.stubGlobal("fetch", vi.fn()); vi.stubEnv("GOLD_API_KEY", ""); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("allowlists assets and never fetches arbitrary URLs", async () => {
  expect((await GET(new Request("http://localhost/api/market?symbol=BAD"))).status).toBe(400);
  expect((await GET(new Request("http://localhost/api/market?symbol=BTC&url=https://bad"))).status).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
});
it("normalizes spot price and isolates cached assets", async () => {
  vi.mocked(fetch).mockResolvedValue(Response.json({ data: { base: "BTC", currency: "USD", amount: "100" } }));
  const r = await GET(new Request("http://localhost/api/market?symbol=BTC"));
  expect(await r.json()).toMatchObject({ price: "100", symbol: "BTC", marketUpdatedAt: null });
  vi.mocked(fetch).mockRejectedValue(new Error("offline"));
  expect(await (await GET(new Request("http://localhost/api/market?symbol=BTC"))).json()).toMatchObject({ stale: true });
  expect((await GET(new Request("http://localhost/api/market?symbol=ETH"))).status).toBe(503);
});
it("keeps gold manual mode available without credentials", async () => {
  const r = await GET(new Request("http://localhost/api/market?symbol=XAU")); expect(r.status).toBe(503);
  expect(await r.json()).toMatchObject({ error: { manualInputAllowed: true } }); expect(fetch).not.toHaveBeenCalled();
});
it("uses the gold key only upstream and validates source/currency/time", async () => {
  vi.stubEnv("GOLD_API_KEY", "test-only-secret");
  vi.mocked(fetch).mockResolvedValue(Response.json({ metal: "XAU", currency: "USD", price: 1000, timestamp: 1788825600 }));
  const response = await GET(new Request("http://localhost/api/market?symbol=XAU")); const json = await response.text();
  expect(fetch).toHaveBeenCalledWith("https://www.goldapi.io/api/XAU/USD", expect.objectContaining({ headers: expect.objectContaining({ "x-access-token": "test-only-secret" }) }));
  expect(json).not.toContain("test-only-secret"); expect(JSON.parse(json).unit).toBe("troy_ounce");
  clearMarketCacheForTests(); vi.mocked(fetch).mockResolvedValue(Response.json({ metal: "XAU", currency: "EUR", price: 1000, timestamp: 1788825600 }));
  expect((await GET(new Request("http://localhost/api/market?symbol=XAU"))).status).toBe(503);
});
