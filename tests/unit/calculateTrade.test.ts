import { describe, expect, it } from "vitest";
import { calculateTrade } from "@/lib/calculation/calculateTrade";

const baseInput = {
  quantity: "0.1",
  buyPriceUsd: "50000",
  sellPriceUsd: "60000",
  buyFee: { mode: "fixed" as const, value: "0" },
  sellFee: { mode: "fixed" as const, value: "0" },
  usdThb: "34",
};

describe("calculateTrade", () => {
  it("matches the MVP acceptance criteria", () => {
    expect(calculateTrade(baseInput)).toMatchObject({
      totalCostUsd: 5000,
      netSellUsd: 6000,
      profitUsd: 1000,
      roiPercent: 20,
      profitThb: 34000,
      breakEvenSellPriceUsd: 50000,
    });
  });

  it("calculates a loss and percentage fees", () => {
    const result = calculateTrade({
      ...baseInput,
      sellPriceUsd: "45000",
      buyFee: { mode: "percent", value: "1" },
      sellFee: { mode: "percent", value: "1" },
    });
    expect(result.totalCostUsd).toBe(5050);
    expect(result.netSellUsd).toBe(4455);
    expect(result.profitUsd).toBe(-595);
    expect(result.roiPercent).toBeCloseTo(-11.782178217822, 10);
    expect(result.breakEvenSellPriceUsd).toBeCloseTo(51010.10101010101, 8);
  });

  it("keeps decimal arithmetic exact at the money boundary", () => {
    const result = calculateTrade({
      quantity: "0.1",
      buyPriceUsd: "0.2",
      sellPriceUsd: "0.3",
      buyFee: { mode: "fixed", value: "0" },
      sellFee: { mode: "fixed", value: "0" },
      usdThb: "35.75",
    });
    expect(result.totalCostUsd).toBe(0.02);
    expect(result.netSellUsd).toBe(0.03);
    expect(result.profitUsd).toBe(0.01);
  });

  it("returns zero ROI and break-even for zero quantity", () => {
    const result = calculateTrade({ ...baseInput, quantity: "0" });
    expect(result.roiPercent).toBe(0);
    expect(result.breakEvenSellPriceUsd).toBe(0);
  });

  it("rejects invalid negative and 100 percent fees", () => {
    expect(() => calculateTrade({ ...baseInput, quantity: "-1" })).toThrow(/Quantity/);
    expect(() =>
      calculateTrade({ ...baseInput, sellFee: { mode: "percent", value: "100" } }),
    ).toThrow(/less than 100/);
  });
});
