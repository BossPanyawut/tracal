import { z } from "zod";
import type { CalculatorState } from "./types";

const STORAGE_KEY = "tracal.calculator.v1";

const feeSchema = z.object({
  mode: z.enum(["percent", "fixed"]),
  value: z.string(),
});

const storedStateSchema = z.object({
  capitalThb: z.string(),
  buyPriceUsd: z.string(),
  sellPriceUsd: z.string(),
  buyFee: feeSchema,
  sellFee: feeSchema,
  manualUsdThb: z.string(),
  targetProfitThb: z.string(),
});

/** Returns the saved inputs, or null when there is nothing usable to restore. */
export function loadState(): CalculatorState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = storedStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies) or hold data
    // from an older shape. Either way there is nothing to restore.
    return null;
  }
}

export function saveState(state: CalculatorState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is a convenience; failing to save must not break the page.
  }
}
