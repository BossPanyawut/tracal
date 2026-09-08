import { z } from "zod";
import { fetchWithRetry, positiveIntegerFromEnv } from "./fetchWithRetry";
import type { FxProvider, FxQuote } from "./types";

const responseSchema = z.object({
  date: z.iso.date(),
  base: z.literal("USD"),
  quote: z.literal("THB"),
  rate: z.number().positive().finite(),
});

export class FrankfurterProvider implements FxProvider {
  async getUsdThb(): Promise<FxQuote> {
    const response = await fetchWithRetry(
      "https://api.frankfurter.dev/v2/rate/USD/THB?providers=BOT",
      {
        headers: { accept: "application/json" },
        next: {
          revalidate: positiveIntegerFromEnv(process.env.FX_CACHE_SECONDS, 3_600),
        },
      },
    );
    const payload = responseSchema.parse(await response.json());
    return {
      base: "USD",
      quote: "THB",
      rate: payload.rate,
      source: "BOT via Frankfurter",
      referenceDate: payload.date,
      fetchedAt: new Date().toISOString(),
      stale: false,
    };
  }
}
