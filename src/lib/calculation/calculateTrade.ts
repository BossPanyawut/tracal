import Decimal from "decimal.js";
import {
  decimal,
  derivePosition,
  feeRate,
  numberAtBoundary,
  sellPriceForNetProceeds,
} from "./position";
import type { TradeCalculationInput, TradeCalculationResult } from "./types";

export function calculateTrade(input: TradeCalculationInput): TradeCalculationResult {
  const position = derivePosition(input);
  const sellPrice = decimal(input.sellPriceUsd, "ราคาขาย");

  const grossSell = position.quantity.times(sellPrice);
  const sellFee = input.sellFee.mode === "percent"
    ? grossSell.times(feeRate(input.sellFee, "ค่าธรรมเนียมขาย"))
    : decimal(input.sellFee.value, "ค่าธรรมเนียมขาย");
  const netSell = grossSell.minus(sellFee);
  const profit = netSell.minus(position.totalCost);
  const roi = position.totalCost.isZero()
    ? new Decimal(0)
    : profit.dividedBy(position.totalCost).times(100);

  return {
    capitalUsd: numberAtBoundary(position.capitalUsd),
    quantity: numberAtBoundary(position.quantity),
    grossBuyUsd: numberAtBoundary(position.grossBuy),
    buyFeeUsd: numberAtBoundary(position.buyFee),
    totalCostUsd: numberAtBoundary(position.totalCost),
    totalCostThb: numberAtBoundary(position.capitalThb),
    grossSellUsd: numberAtBoundary(grossSell),
    sellFeeUsd: numberAtBoundary(sellFee),
    netSellUsd: numberAtBoundary(netSell),
    profitUsd: numberAtBoundary(profit),
    profitThb: numberAtBoundary(profit.times(position.usdThb)),
    roiPercent: numberAtBoundary(roi),
    breakEvenSellPriceUsd: numberAtBoundary(
      sellPriceForNetProceeds(position.quantity, input.sellFee, position.totalCost),
    ),
  };
}
