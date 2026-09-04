import { CoinGeckoProvider } from "@/lib/providers/coingecko";
import { GoldApiProvider } from "@/lib/providers/goldapi";
import type {
  CryptoAssetId,
  CryptoPriceProvider,
  GoldMarketQuote,
  GoldPriceProvider,
  MarketQuote,
} from "@/lib/providers/types";

const lastKnownCrypto = new Map<CryptoAssetId, MarketQuote>();
let lastKnownGold: GoldMarketQuote | null = null;

export async function getCryptoQuote(
  id: CryptoAssetId,
  provider: CryptoPriceProvider = new CoinGeckoProvider(),
): Promise<MarketQuote> {
  try {
    const quote = await provider.getPrice(id);
    lastKnownCrypto.set(id, quote);
    return quote;
  } catch (error) {
    const cached = lastKnownCrypto.get(id);
    if (cached) return { ...cached, stale: true };
    throw error;
  }
}

export async function getGoldQuote(
  provider: GoldPriceProvider = new GoldApiProvider(),
): Promise<GoldMarketQuote> {
  try {
    const quote = await provider.getXauUsd();
    lastKnownGold = quote;
    return quote;
  } catch (error) {
    if (lastKnownGold) return { ...lastKnownGold, stale: true };
    throw error;
  }
}

export function clearMarketCacheForTests(): void {
  lastKnownCrypto.clear();
  lastKnownGold = null;
}
