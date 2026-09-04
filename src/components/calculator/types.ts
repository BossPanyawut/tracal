import type { FeeInput } from "@/lib/calculation/types";
import type { FxQuote, GoldMarketQuote, MarketQuote } from "@/lib/providers/types";

export type CalculatorState = {
  assetType: "crypto" | "gold";
  assetId: "bitcoin" | "ethereum";
  quantity: string;
  buyPriceUsd: string;
  sellPriceUsd: string;
  buyFee: FeeInput & { value: string };
  sellFee: FeeInput & { value: string };
  fxMode: "live" | "manual";
  manualUsdThb: string;
  goldUnit: "oz" | "gram";
};

export type MarketState = {
  quote: MarketQuote | GoldMarketQuote | null;
  loading: boolean;
  error: string | null;
};

export type FxState = {
  quote: FxQuote | null;
  loading: boolean;
  error: string | null;
};
