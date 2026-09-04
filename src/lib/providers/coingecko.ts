import { z } from "zod";
import { fetchWithRetry, positiveIntegerFromEnv } from "./fetchWithRetry";
import {
  CRYPTO_ASSETS,
  type CryptoAssetId,
  type CryptoPriceProvider,
  type MarketQuote,
} from "./types";

const itemSchema = z.object({
  usd: z.number().positive().finite(),
  last_updated_at: z.number().int().positive().optional(),
});

export class CoinGeckoProvider implements CryptoPriceProvider {
  async getPrice(id: CryptoAssetId): Promise<MarketQuote> {
    const url = new URL("https://api.coingecko.com/api/v3/simple/price");
    url.searchParams.set("ids", id);
    url.searchParams.set("vs_currencies", "usd");
    url.searchParams.set("include_last_updated_at", "true");

    const headers: HeadersInit = { accept: "application/json" };
    if (process.env.COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
    }

    const response = await fetchWithRetry(url.toString(), {
      headers,
      next: {
        revalidate: positiveIntegerFromEnv(process.env.MARKET_CACHE_SECONDS, 60),
      },
    });
    const payload = z.record(z.string(), itemSchema).parse(await response.json());
    const item = payload[id];
    if (!item) throw new Error("CoinGecko response did not include the requested asset.");

    return {
      symbol: CRYPTO_ASSETS[id].symbol,
      currency: "USD",
      price: item.usd,
      source: "CoinGecko",
      marketUpdatedAt: item.last_updated_at
        ? new Date(item.last_updated_at * 1_000).toISOString()
        : null,
      fetchedAt: new Date().toISOString(),
      stale: false,
    };
  }
}
