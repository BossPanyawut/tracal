import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CoinGeckoProvider } from "@/lib/providers/coingecko";
import { CoinbaseFxProvider } from "@/lib/providers/coinbase";
import { FrankfurterProvider } from "@/lib/providers/frankfurter";
import { GoldApiProvider } from "@/lib/providers/goldapi";

describe("provider adapters", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T03:04:05.000Z"));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete process.env.GOLD_API_KEY;
  });

  it("normalizes a CoinGecko quote", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ bitcoin: { usd: 123456.78, last_updated_at: 1767323045 } })),
    );
    const quote = await new CoinGeckoProvider().getPrice("bitcoin");
    expect(quote).toEqual({
      symbol: "BTC",
      currency: "USD",
      price: 123456.78,
      source: "CoinGecko",
      marketUpdatedAt: "2026-01-02T03:04:05.000Z",
      fetchedAt: "2026-01-02T03:04:05.000Z",
      stale: false,
    });
  });

  it("normalizes a BOT-backed Frankfurter rate", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ date: "2026-01-02", base: "USD", quote: "THB", rate: 34.25 })),
    );
    const quote = await new FrankfurterProvider().getUsdThb();
    expect(quote).toMatchObject({
      base: "USD",
      quote: "THB",
      rate: 34.25,
      source: "BOT via Frankfurter",
      referenceDate: "2026-01-02",
    });
  });

  it("normalizes the current Coinbase USD/THB rate", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: { currency: "USD", rates: { THB: "32.93875" } } })),
    );
    const quote = await new CoinbaseFxProvider().getUsdThb();
    expect(quote).toEqual({
      base: "USD",
      quote: "THB",
      rate: 32.93875,
      source: "Coinbase",
      referenceDate: "2026-01-02",
      fetchedAt: "2026-01-02T03:04:05.000Z",
      stale: false,
    });
  });

  it("keeps the Gold API key in a server-side header and normalizes the result", async () => {
    process.env.GOLD_API_KEY = "test-secret";
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ price: 4050.5, bid: 4049, ask: 4052, timestamp: 1767323045 })),
    );
    const quote = await new GoldApiProvider().getXauUsd();
    expect(quote).toMatchObject({ symbol: "XAU", unit: "troy_ounce", price: 4050.5 });
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).get("x-access-token")).toBe("test-secret");
  });

  it("rejects malformed upstream data", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ bitcoin: { usd: -1 } })));
    await expect(new CoinGeckoProvider().getPrice("bitcoin")).rejects.toThrow();
  });
});
