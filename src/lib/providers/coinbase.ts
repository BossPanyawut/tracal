import { z } from "zod";
import { fetchWithRetry, positiveIntegerFromEnv } from "./fetchWithRetry";
import type { FxProvider, FxQuote } from "./types";

const responseSchema = z.object({
  data: z.object({
    currency: z.literal("USD"),
    rates: z.object({ THB: z.string() }),
  }),
});

export class CoinbaseFxProvider implements FxProvider {
  async getUsdThb(): Promise<FxQuote> {
    const response = await fetchWithRetry(
      "https://api.coinbase.com/v2/exchange-rates?currency=USD",
      {
        headers: { accept: "application/json" },
        next: {
          revalidate: positiveIntegerFromEnv(process.env.FX_CACHE_SECONDS, 60),
        },
      },
    );
    const payload = responseSchema.parse(await response.json());
    const rate = Number(payload.data.rates.THB);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("Coinbase returned an invalid USD/THB rate.");
    }
    const fetchedAt = new Date().toISOString();
    return {
      base: "USD",
      quote: "THB",
      rate,
      source: "Coinbase",
      referenceDate: fetchedAt.slice(0, 10),
      fetchedAt,
      stale: false,
    };
  }
}
