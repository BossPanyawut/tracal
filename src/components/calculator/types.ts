import type { FeeInput } from "@/lib/calculation/types";
import type { FxQuote } from "@/lib/providers/types";

export type CalculatorState = {
  capitalThb: string;
  buyPriceUsd: string;
  sellPriceUsd: string;
  buyFee: FeeInput & { value: string };
  sellFee: FeeInput & { value: string };
  manualUsdThb: string;
  targetProfitThb: string;
};

export type FxState = {
  quote: FxQuote | null;
  loading: boolean;
  error: boolean;
};
