import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearFxCacheForTests, getUsdThbQuote } from "@/lib/services/fxService";
import {
  clearMarketCacheForTests,
  getCryptoQuote,
} from "@/lib/services/marketDataService";
import type { CryptoPriceProvider, FxProvider } from "@/lib/providers/types";

describe("last-known-good fallback", () => {
  beforeEach(() => {
    clearFxCacheForTests();
    clearMarketCacheForTests();
  });

  it("returns a stale crypto quote when a later request fails", async () => {
    const getPrice = vi
      .fn<CryptoPriceProvider["getPrice"]>()
      .mockResolvedValueOnce({
        symbol: "BTC",
        currency: "USD",
        price: 100,
        source: "test",
        marketUpdatedAt: null,
        fetchedAt: "2026-01-01T00:00:00.000Z",
        stale: false,
      })
      .mockRejectedValueOnce(new Error("offline"));
    const provider: CryptoPriceProvider = { getPrice };

    await getCryptoQuote("bitcoin", provider);
    await expect(getCryptoQuote("bitcoin", provider)).resolves.toMatchObject({
      price: 100,
      stale: true,
    });
  });

  it("throws when FX fails before a good quote has been cached", async () => {
    const provider: FxProvider = { getUsdThb: vi.fn().mockRejectedValue(new Error("offline")) };
    await expect(getUsdThbQuote(provider, null)).rejects.toThrow("offline");
  });

  it("uses the daily reference provider when the current FX provider fails", async () => {
    const primary: FxProvider = { getUsdThb: vi.fn().mockRejectedValue(new Error("offline")) };
    const fallbackQuote = {
      base: "USD" as const,
      quote: "THB" as const,
      rate: 33.0839,
      source: "BOT via Frankfurter",
      referenceDate: "2026-01-01",
      fetchedAt: "2026-01-02T00:00:00.000Z",
      stale: false,
    };
    const fallback: FxProvider = { getUsdThb: vi.fn().mockResolvedValue(fallbackQuote) };
    await expect(getUsdThbQuote(primary, fallback)).resolves.toEqual(fallbackQuote);
  });
});
