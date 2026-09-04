import { describe, expect, it } from "vitest";
import { calculateTrade } from "@/lib/calculation/calculateTrade";

const baseInput = {
  capitalThb: "3300",
  buyPriceUsd: "1",
  sellPriceUsd: "2",
  buyFee: { mode: "fixed" as const, value: "0" },
  sellFee: { mode: "fixed" as const, value: "0" },
  usdThb: "33",
};

describe("calculateTrade", () => {
  it("converts THB capital and derives the quantity it buys", () => {
    expect(calculateTrade(baseInput)).toMatchObject({
      capitalUsd: 100,
      quantity: 100,
      totalCostUsd: 100,
      netSellUsd: 200,
      profitUsd: 100,
      profitThb: 3300,
      roiPercent: 100,
      breakEvenSellPriceUsd: 1,
    });
  });

  it("takes a percentage buy fee out of the capital", () => {
    const result = calculateTrade({
      ...baseInput,
      buyFee: { mode: "percent", value: "1" },
      sellFee: { mode: "percent", value: "1" },
    });
    // 100 USD of capital buys 100 / 1.01 units once the 1% fee is taken out.
    expect(result.quantity).toBeCloseTo(99.00990099009901, 10);
    expect(result.grossBuyUsd).toBeCloseTo(99.00990099009901, 10);
    expect(result.buyFeeUsd).toBeCloseTo(0.9900990099009901, 10);
    expect(result.totalCostUsd).toBe(100);
    expect(result.netSellUsd).toBeCloseTo(196.03960396039605, 10);
    expect(result.profitUsd).toBeCloseTo(96.03960396039605, 10);
    // Break-even carries both fees: 1.01 / 0.99 = 101/99.
    expect(result.breakEvenSellPriceUsd).toBeCloseTo(101 / 99, 10);
  });

  it("subtracts a fixed buy fee before buying", () => {
    const result = calculateTrade({
      ...baseInput,
      buyFee: { mode: "fixed", value: "10" },
      sellFee: { mode: "fixed", value: "10" },
    });
    expect(result.quantity).toBe(90);
    expect(result.buyFeeUsd).toBe(10);
    expect(result.totalCostUsd).toBe(100);
    expect(result.netSellUsd).toBe(170);
    expect(result.profitUsd).toBe(70);
    expect(result.breakEvenSellPriceUsd).toBeCloseTo(1.2222222222, 8);
  });

  it("reports a loss when the sell price falls below the break-even price", () => {
    const result = calculateTrade({ ...baseInput, sellPriceUsd: "0.8" });
    expect(result.profitUsd).toBeCloseTo(-20, 10);
    expect(result.profitThb).toBeCloseTo(-660, 8);
    expect(result.roiPercent).toBeCloseTo(-20, 10);
  });

  it("returns zeroes for zero capital", () => {
    const result = calculateTrade({ ...baseInput, capitalThb: "0" });
    expect(result.quantity).toBe(0);
    expect(result.profitUsd).toBe(0);
    expect(result.roiPercent).toBe(0);
    expect(result.breakEvenSellPriceUsd).toBe(0);
  });

  it("rejects invalid inputs", () => {
    expect(() => calculateTrade({ ...baseInput, capitalThb: "-1" })).toThrow(/เงินทุน|Capital/i);
    expect(() => calculateTrade({ ...baseInput, buyPriceUsd: "0" })).toThrow(/ราคาซื้อ|Buy price/i);
    expect(() => calculateTrade({ ...baseInput, usdThb: "0" })).toThrow(/USD\/THB/i);
    expect(() =>
      calculateTrade({ ...baseInput, sellFee: { mode: "percent", value: "100" } }),
    ).toThrow(/100%/);
  });

  it("rejects a fixed buy fee that swallows the whole capital", () => {
    expect(() =>
      calculateTrade({ ...baseInput, buyFee: { mode: "fixed", value: "100" } }),
    ).toThrow(/ค่าธรรมเนียม|fee/i);
  });
});
