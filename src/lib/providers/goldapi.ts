import { z } from "zod";
import { fetchWithRetry, positiveIntegerFromEnv } from "./fetchWithRetry";
import type { GoldMarketQuote, GoldPriceProvider } from "./types";

const responseSchema = z.object({
  price: z.number().positive().finite(),
  bid: z.number().positive().finite().optional(),
  ask: z.number().positive().finite().optional(),
  timestamp: z.number().int().positive().optional(),
});

export class GoldApiProvider implements GoldPriceProvider {
  async getXauUsd(): Promise<GoldMarketQuote> {
    const apiKey = process.env.GOLD_API_KEY;
    if (!apiKey) {
      throw new Error("Gold live price is not configured.");
    }

    const response = await fetchWithRetry("https://www.goldapi.io/api/XAU/USD", {
      headers: { accept: "application/json", "x-access-token": apiKey },
      next: {
        revalidate: positiveIntegerFromEnv(process.env.MARKET_CACHE_SECONDS, 60),
      },
    });
    const payload = responseSchema.parse(await response.json());
    return {
      symbol: "XAU",
      currency: "USD",
      unit: "troy_ounce",
      price: payload.price,
      bid: payload.bid ?? null,
      ask: payload.ask ?? null,
      source: "GoldAPI",
      marketUpdatedAt: payload.timestamp
        ? new Date(payload.timestamp * 1_000).toISOString()
        : null,
      fetchedAt: new Date().toISOString(),
      stale: false,
    };
  }
}
