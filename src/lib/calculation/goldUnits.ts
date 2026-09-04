import Decimal from "decimal.js";

export const GRAMS_PER_TROY_OUNCE = new Decimal("31.1034768");

export function gramsToTroyOunces(grams: string | number): Decimal {
  const value = new Decimal(grams);
  if (!value.isFinite() || value.isNegative()) {
    throw new Error("Gold quantity must be a non-negative finite number.");
  }
  return value.dividedBy(GRAMS_PER_TROY_OUNCE);
}

export function toTroyOunces(quantity: string | number, unit: "oz" | "gram"): string {
  const value = unit === "gram" ? gramsToTroyOunces(quantity) : new Decimal(quantity);
  if (!value.isFinite() || value.isNegative()) {
    throw new Error("Gold quantity must be a non-negative finite number.");
  }
  return value.toString();
}
