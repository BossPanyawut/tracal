// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CoinbaseFxProvider } from "@/lib/providers/coinbase";
import { FrankfurterProvider } from "@/lib/providers/frankfurter";
import { clearFxCacheForTests, getUsdThbQuote } from "@/lib/services/fxService";
import { fetchWithRetry } from "@/lib/providers/fetchWithRetry";
import { GET } from "@/app/api/fx/route";
import { clearRateLimitsForTests } from "@/lib/http/rateLimit";
const cb = () => Response.json({ data: { currency: "USD", rates: { THB: "35" } } });
const bot = () => Response.json({ date: "2026-09-04", base: "USD", quote: "THB", rate: 34 });
beforeEach(() => { clearFxCacheForTests(); clearRateLimitsForTests(); vi.stubGlobal("fetch", vi.fn()); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe("FX provider contracts", () => {
  it("normalizes Coinbase without manufacturing market timestamps", async () => {
    vi.mocked(fetch).mockResolvedValue(cb());
    expect(await new CoinbaseFxProvider().getUsdThb()).toMatchObject({ rate: 35, source: "Coinbase", referenceDate: null, stale: false });
  });
  it("normalizes BOT reference date independently of fetch time", async () => {
    vi.mocked(fetch).mockResolvedValue(bot());
    expect(await new FrankfurterProvider().getUsdThb()).toMatchObject({ rate: 34, referenceDate: "2026-09-04" });
  });
  it.each(["NaN", "0", "-1", "Infinity"])("rejects bad Coinbase rate %s", async (rate) => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ data: { currency: "USD", rates: { THB: rate } } }));
    await expect(new CoinbaseFxProvider().getUsdThb()).rejects.toThrow();
  });
  it("rejects malformed payloads and invalid dates", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{broken"));
    await expect(new CoinbaseFxProvider().getUsdThb()).rejects.toThrow();
    vi.mocked(fetch).mockResolvedValue(Response.json({ date: "2026-02-30", base: "USD", quote: "THB", rate: 34 }));
    await expect(new FrankfurterProvider().getUsdThb()).rejects.toThrow();
  });
  it("retries timeouts once with bounded signals", async () => {
    vi.mocked(fetch).mockImplementation(async (_url, init) => { expect(init?.signal).toBeInstanceOf(AbortSignal); throw new DOMException("Timeout", "TimeoutError"); });
    const timeout = vi.spyOn(AbortSignal, "timeout");
    await expect(fetchWithRetry("https://example.test")).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(2); expect(timeout).toHaveBeenCalledWith(5000);
    timeout.mockRestore();
  });
});
describe("FX route resilience", () => {
  it("falls back then serves last known good as stale", async () => {
    vi.mocked(fetch).mockImplementation(async (url) => { if (String(url).includes("coinbase")) throw new Error("down"); return bot(); });
    expect(await getUsdThbQuote()).toMatchObject({ source: "BOT via Frankfurter", stale: false });
    vi.mocked(fetch).mockRejectedValue(new Error("down"));
    expect(await getUsdThbQuote()).toMatchObject({ source: "BOT via Frankfurter", stale: true });
  });
  it("returns manual-allowed 503 with no quote and 400 for invalid pairs", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("down"));
    const response = await GET(new Request("http://localhost/api/fx"));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { manualInputAllowed: true } });
    expect((await GET(new Request("http://localhost/api/fx?base=USDT"))).status).toBe(400);
  });
  it("bounds repeated calls to the public route", async () => {
    vi.mocked(fetch).mockImplementation(async () => cb());
    for (let i = 0; i < 60; i++) expect((await GET(new Request("http://localhost/api/fx"))).status).toBe(200);
    expect((await GET(new Request("http://localhost/api/fx"))).status).toBe(429);
  });
});
