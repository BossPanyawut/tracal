import Decimal from "decimal.js";
import type {
  FeeInput,
  TradeCalculationInput,
  TradeCalculationResult,
} from "./types";

Decimal.set({ precision: 32, rounding: Decimal.ROUND_HALF_UP });

function decimal(value: string | number, name: string): Decimal {
  let parsed: Decimal;
  try {
    parsed = new Decimal(value);
  } catch {
    throw new Error(`${name} must be a valid number.`);
  }
  if (!parsed.isFinite() || parsed.isNegative()) {
    throw new Error(`${name} must be a non-negative finite number.`);
  }
  return parsed;
}

function feeAmount(gross: Decimal, fee: FeeInput, name: string): Decimal {
  const value = decimal(fee.value, name);
  if (fee.mode === "percent") {
    if (value.greaterThanOrEqualTo(100)) {
      throw new Error(`${name} percentage must be less than 100.`);
    }
    return gross.times(value).dividedBy(100);
  }
  return value;
}

function numberAtBoundary(value: Decimal): number {
  return value.toDecimalPlaces(12).toNumber();
}

export function calculateTrade(input: TradeCalculationInput): TradeCalculationResult {
  const quantity = decimal(input.quantity, "Quantity");
  const buyPrice = decimal(input.buyPriceUsd, "Buy price");
  const sellPrice = decimal(input.sellPriceUsd, "Sell price");
  const usdThb = decimal(input.usdThb, "USD/THB rate");

  const grossBuy = quantity.times(buyPrice);
  const buyFee = feeAmount(grossBuy, input.buyFee, "Buy fee");
  const totalCost = grossBuy.plus(buyFee);
  const grossSell = quantity.times(sellPrice);
  const sellFee = feeAmount(grossSell, input.sellFee, "Sell fee");
  const netSell = grossSell.minus(sellFee);
  const profit = netSell.minus(totalCost);
  const roi = totalCost.isZero() ? new Decimal(0) : profit.dividedBy(totalCost).times(100);

  let breakEven = new Decimal(0);
  if (!quantity.isZero()) {
    if (input.sellFee.mode === "percent") {
      const rate = decimal(input.sellFee.value, "Sell fee").dividedBy(100);
      breakEven = totalCost.dividedBy(quantity.times(new Decimal(1).minus(rate)));
    } else {
      breakEven = totalCost.plus(decimal(input.sellFee.value, "Sell fee")).dividedBy(quantity);
    }
  }

  return {
    grossBuyUsd: numberAtBoundary(grossBuy),
    buyFeeUsd: numberAtBoundary(buyFee),
    totalCostUsd: numberAtBoundary(totalCost),
    grossSellUsd: numberAtBoundary(grossSell),
    sellFeeUsd: numberAtBoundary(sellFee),
    netSellUsd: numberAtBoundary(netSell),
    profitUsd: numberAtBoundary(profit),
    roiPercent: numberAtBoundary(roi),
    breakEvenSellPriceUsd: numberAtBoundary(breakEven),
    totalCostThb: numberAtBoundary(totalCost.times(usdThb)),
    netSellThb: numberAtBoundary(netSell.times(usdThb)),
    profitThb: numberAtBoundary(profit.times(usdThb)),
  };
}
