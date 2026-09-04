export type FeeMode = "fixed" | "percent";

export type FeeInput = {
  mode: FeeMode;
  value: string | number;
};

export type TradeCalculationInput = {
  capitalThb: string | number;
  buyPriceUsd: string | number;
  sellPriceUsd: string | number;
  buyFee: FeeInput;
  sellFee: FeeInput;
  usdThb: string | number;
};

export type TradeCalculationResult = {
  capitalUsd: number;
  quantity: number;
  grossBuyUsd: number;
  buyFeeUsd: number;
  totalCostUsd: number;
  totalCostThb: number;
  grossSellUsd: number;
  sellFeeUsd: number;
  netSellUsd: number;
  profitUsd: number;
  profitThb: number;
  roiPercent: number;
  breakEvenSellPriceUsd: number;
};
