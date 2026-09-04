import Decimal from "decimal.js";
import type { FeeInput } from "./types";

Decimal.set({ precision: 32, rounding: Decimal.ROUND_HALF_UP });

export function decimal(value: string | number, name: string): Decimal {
  let parsed: Decimal;
  try {
    parsed = new Decimal(value);
  } catch {
    throw new Error(`${name}ต้องเป็นตัวเลข`);
  }
  if (!parsed.isFinite() || parsed.isNegative()) {
    throw new Error(`${name}ต้องเป็นตัวเลขที่ไม่ติดลบ`);
  }
  return parsed;
}

export function positiveDecimal(value: string | number, name: string): Decimal {
  const parsed = decimal(value, name);
  if (parsed.isZero()) {
    throw new Error(`${name}ต้องมากกว่า 0`);
  }
  return parsed;
}

export function feeRate(fee: FeeInput, name: string): Decimal {
  const value = decimal(fee.value, name);
  if (value.greaterThanOrEqualTo(100)) {
    throw new Error(`${name}แบบเปอร์เซ็นต์ต้องน้อยกว่า 100%`);
  }
  return value.dividedBy(100);
}

export function numberAtBoundary(value: Decimal): number {
  return value.toDecimalPlaces(12).toNumber();
}

export type PositionInput = {
  capitalThb: string | number;
  buyPriceUsd: string | number;
  buyFee: FeeInput;
  usdThb: string | number;
};

export type Position = {
  usdThb: Decimal;
  capitalThb: Decimal;
  capitalUsd: Decimal;
  grossBuy: Decimal;
  quantity: Decimal;
  buyFee: Decimal;
  totalCost: Decimal;
};

/**
 * The capital is what leaves the account, so the buy fee comes out of it and
 * only the remainder actually buys units.
 */
export function derivePosition(input: PositionInput): Position {
  const capitalThb = decimal(input.capitalThb, "เงินทุน");
  const buyPrice = positiveDecimal(input.buyPriceUsd, "ราคาซื้อ");
  const usdThb = positiveDecimal(input.usdThb, "อัตรา USD/THB");
  const capitalUsd = capitalThb.dividedBy(usdThb);

  let grossBuy: Decimal;
  if (input.buyFee.mode === "percent") {
    grossBuy = capitalUsd.dividedBy(new Decimal(1).plus(feeRate(input.buyFee, "ค่าธรรมเนียมซื้อ")));
  } else {
    const fixedFee = decimal(input.buyFee.value, "ค่าธรรมเนียมซื้อ");
    grossBuy = capitalUsd.minus(fixedFee);
    if (grossBuy.isNegative() || (grossBuy.isZero() && capitalUsd.greaterThan(0))) {
      throw new Error("ค่าธรรมเนียมซื้อมากกว่าเงินทุนที่ใส่");
    }
  }

  return {
    usdThb,
    capitalThb,
    capitalUsd,
    grossBuy,
    quantity: grossBuy.dividedBy(buyPrice),
    buyFee: capitalUsd.minus(grossBuy),
    totalCost: capitalUsd,
  };
}

/** Sell price at which the net proceeds equal `targetNetSell`. */
export function sellPriceForNetProceeds(
  quantity: Decimal,
  sellFee: FeeInput,
  targetNetSell: Decimal,
): Decimal {
  if (quantity.isZero()) return new Decimal(0);
  if (sellFee.mode === "percent") {
    const rate = feeRate(sellFee, "ค่าธรรมเนียมขาย");
    return targetNetSell.dividedBy(quantity.times(new Decimal(1).minus(rate)));
  }
  return targetNetSell.plus(decimal(sellFee.value, "ค่าธรรมเนียมขาย")).dividedBy(quantity);
}
