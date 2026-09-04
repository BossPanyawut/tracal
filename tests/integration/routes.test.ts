import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/fxService", () => ({ getUsdThbQuote: vi.fn() }));
vi.mock("@/lib/services/marketDataService", () => ({
  getCryptoQuote: vi.fn(),
  getGoldQuote: vi.fn(),
}));

import { GET as getFx } from "@/app/api/fx/route";
import { GET as getMarket } from "@/app/api/market/route";
import { getUsdThbQuote } from "@/lib/services/fxService";
import { getCryptoQuote } from "@/lib/services/marketDataService";

describe("internal API routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an unsupported crypto id", async () => {
    const response = await getMarket(
      new Request("http://localhost/api/market?type=crypto&id=not-a-coin", {
        headers: { "x-forwarded-for": "invalid-test" },
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "INVALID_REQUEST" } });
  });

  it("returns a normalized crypto response", async () => {
    vi.mocked(getCryptoQuote).mockResolvedValue({
      symbol: "BTC",
      currency: "USD",
      price: 120000,
      source: "CoinGecko",
      marketUpdatedAt: null,
      fetchedAt: "2026-01-01T00:00:00.000Z",
      stale: false,
    });
    const response = await getMarket(
      new Request("http://localhost/api/market?type=crypto&id=bitcoin", {
        headers: { "x-forwarded-for": "crypto-test" },
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ type: "crypto", symbol: "BTC", price: 120000 });
  });

  it("returns the manual fallback error contract when FX is unavailable", async () => {
    vi.mocked(getUsdThbQuote).mockRejectedValue(new Error("offline"));
    const response = await getFx(
      new Request("http://localhost/api/fx?base=USD&quote=THB", {
        headers: { "x-forwarded-for": "fx-test" },
      }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: {
        code: "FX_PROVIDER_UNAVAILABLE",
        message: "Live USD/THB is temporarily unavailable. Enter a manual rate to continue.",
        manualInputAllowed: true,
      },
    });
  });
});
