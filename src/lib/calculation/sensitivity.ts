import Decimal from "decimal.js";
import { calculateTrade } from "./calculateTrade";
import { numberAtBoundary } from "./position";
import type { TradeCalculationInput } from "./types";

export const SENSITIVITY_STEPS = [-10, -5, 0, 5, 10] as const;

export type SensitivityRow = {
  stepPercent: number;
  sellPriceUsd: number;
  profitUsd: number;
  profitThb: number;
  roiPercent: number;
  current: boolean;
};

/**
 * Profit at a ladder of sell prices around the one entered, so the downside is
 * visible next to the upside. Returns an empty ladder if the inputs don't
 * calculate at all — the caller already surfaces that error.
 */
export function buildSensitivity(input: TradeCalculationInput): SensitivityRow[] {
  let basePrice: Decimal;
  try {
    basePrice = new Decimal(input.sellPriceUsd);
    if (!basePrice.isFinite() || basePrice.isNegative()) return [];
  } catch {
    return [];
  }

  try {
    return SENSITIVITY_STEPS.map((stepPercent) => {
      const sellPrice = basePrice.times(new Decimal(100 + stepPercent).dividedBy(100));
      const result = calculateTrade({ ...input, sellPriceUsd: sellPrice.toString() });
      return {
        stepPercent,
        sellPriceUsd: numberAtBoundary(sellPrice),
        profitUsd: result.profitUsd,
        profitThb: result.profitThb,
        roiPercent: result.roiPercent,
        current: stepPercent === 0,
      };
    });
  } catch {
    return [];
  }
}
