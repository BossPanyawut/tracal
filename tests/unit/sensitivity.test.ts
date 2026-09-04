import { describe, expect, it } from "vitest";
import { SENSITIVITY_STEPS, buildSensitivity } from "@/lib/calculation/sensitivity";

const baseInput = {
  capitalThb: "3300",
  buyPriceUsd: "1",
  sellPriceUsd: "2",
  buyFee: { mode: "fixed" as const, value: "0" },
  sellFee: { mode: "fixed" as const, value: "0" },
  usdThb: "33",
};

describe("buildSensitivity", () => {
  it("shifts the sell price by each step", () => {
    const rows = buildSensitivity(baseInput);
    expect(rows.map((row) => row.stepPercent)).toEqual(SENSITIVITY_STEPS);
    expect(rows.map((row) => row.sellPriceUsd)).toEqual([1.8, 1.9, 2, 2.1, 2.2]);
  });

  it("marks the row matching the entered sell price", () => {
    const rows = buildSensitivity(baseInput);
    expect(rows.filter((row) => row.current)).toHaveLength(1);
    expect(rows.find((row) => row.current)?.stepPercent).toBe(0);
  });

  it("carries the profit for each shifted price", () => {
    const rows = buildSensitivity(baseInput);
    // 100 units bought with 100 USD of capital, no fees.
    expect(rows[0].profitUsd).toBeCloseTo(80, 10);
    expect(rows[0].profitThb).toBeCloseTo(2640, 8);
    expect(rows[2].profitUsd).toBeCloseTo(100, 10);
    expect(rows[4].profitUsd).toBeCloseTo(120, 10);
  });

  it("returns an empty ladder when the inputs cannot be calculated", () => {
    expect(buildSensitivity({ ...baseInput, buyPriceUsd: "0" })).toEqual([]);
  });
});
