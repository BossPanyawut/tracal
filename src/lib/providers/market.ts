import { z } from "zod";
import { fetchWithRetry } from "./fetchWithRetry";
import { marketQuoteSchema, type MarketQuote } from "./marketTypes";
const lastKnown = new Map<string, MarketQuote>();
export function clearMarketCacheForTests() { lastKnown.clear(); }
export async function getMarketQuote(symbol: MarketQuote["symbol"]): Promise<MarketQuote> {
  try {
    let quote: MarketQuote;
    if (symbol === "XAU") {
      const key = process.env.GOLD_API_KEY;
      if (!key) throw new Error("Gold reference is not configured");
      const response = await fetchWithRetry("https://www.goldapi.io/api/XAU/USD", { headers: { "x-access-token": key, accept: "application/json" }, next: { revalidate: 300 } });
      const payload = z.object({ metal: z.literal("XAU"), currency: z.literal("USD"), price: z.number().positive().finite(), timestamp: z.number().int().positive().max(8_640_000_000_000) }).parse(await response.json());
      quote = marketQuoteSchema.parse({ symbol, currency: "USD", price: String(payload.price), unit: "troy_ounce", source: "GoldAPI", marketUpdatedAt: new Date(payload.timestamp * 1000).toISOString(), fetchedAt: new Date().toISOString(), stale: false });
    } else {
      const response = await fetchWithRetry(`https://api.coinbase.com/v2/prices/${symbol}-USD/spot`, { headers: { accept: "application/json" }, next: { revalidate: 60 } });
      const payload = z.object({ data: z.object({ base: z.literal(symbol), currency: z.literal("USD"), amount: z.string() }) }).parse(await response.json());
      quote = marketQuoteSchema.parse({ symbol, currency: "USD", price: payload.data.amount, unit: "unit", source: "Coinbase spot", marketUpdatedAt: null, fetchedAt: new Date().toISOString(), stale: false });
    }
    lastKnown.set(symbol, quote); return quote;
  } catch (error) { const cached = lastKnown.get(symbol); if (cached) return { ...cached, stale: true }; throw error; }
}
