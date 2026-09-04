import Decimal from "decimal.js";
import {
  derivePosition,
  numberAtBoundary,
  sellPriceForNetProceeds,
} from "./position";
import type { FeeInput } from "./types";

export type RequiredSellPriceInput = {
  capitalThb: string | number;
  buyPriceUsd: string | number;
  buyFee: FeeInput;
  sellFee: FeeInput;
  usdThb: string | number;
  /** Target profit in THB. Negative values answer "how far can this fall?". */
  targetProfitThb: string | number;
};

/** The per-unit sell price in USD that lands exactly on the target profit. */
export function requiredSellPrice(input: RequiredSellPriceInput): number {
  const position = derivePosition(input);
  if (position.quantity.isZero()) return 0;

  let targetProfitThb: Decimal;
  try {
    targetProfitThb = new Decimal(input.targetProfitThb);
  } catch {
    throw new Error("กำไรเป้าหมายต้องเป็นตัวเลข");
  }
  if (!targetProfitThb.isFinite()) {
    throw new Error("กำไรเป้าหมายต้องเป็นตัวเลข");
  }

  const targetNetSell = position.totalCost.plus(targetProfitThb.dividedBy(position.usdThb));
  const price = sellPriceForNetProceeds(position.quantity, input.sellFee, targetNetSell);
  return numberAtBoundary(price.isNegative() ? new Decimal(0) : price);
}
