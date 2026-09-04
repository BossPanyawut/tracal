export type MarketQuote = {
  symbol: string;
  currency: "USD";
  price: number;
  source: string;
  marketUpdatedAt: string | null;
  fetchedAt: string;
  stale: boolean;
};

export type GoldMarketQuote = MarketQuote & {
  symbol: "XAU";
  unit: "troy_ounce";
  bid: number | null;
  ask: number | null;
};

export type FxQuote = {
  base: "USD";
  quote: "THB";
  rate: number;
  source: string;
  referenceDate: string;
  fetchedAt: string;
  stale: boolean;
};

export interface CryptoPriceProvider {
  getPrice(id: CryptoAssetId): Promise<MarketQuote>;
}

export interface GoldPriceProvider {
  getXauUsd(): Promise<GoldMarketQuote>;
}

export interface FxProvider {
  getUsdThb(): Promise<FxQuote>;
}

export const CRYPTO_ASSETS = {
  bitcoin: { symbol: "BTC", name: "Bitcoin" },
  ethereum: { symbol: "ETH", name: "Ethereum" },
} as const;

export type CryptoAssetId = keyof typeof CRYPTO_ASSETS;

export function isCryptoAssetId(value: string): value is CryptoAssetId {
  return value in CRYPTO_ASSETS;
}
