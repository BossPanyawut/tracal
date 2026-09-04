export type FeeMode = "fixed" | "percent";

export type FeeInput = {
  mode: FeeMode;
  value: string | number;
};

export type TradeCalculationInput = {
  quantity: string | number;
  buyPriceUsd: string | number;
  sellPriceUsd: string | number;
  buyFee: FeeInput;
  sellFee: FeeInput;
  usdThb: string | number;
};

export type TradeCalculationResult = {
  grossBuyUsd: number;
  buyFeeUsd: number;
  totalCostUsd: number;
  grossSellUsd: number;
  sellFeeUsd: number;
  netSellUsd: number;
  profitUsd: number;
  roiPercent: number;
  breakEvenSellPriceUsd: number;
  totalCostThb: number;
  netSellThb: number;
  profitThb: number;
};
