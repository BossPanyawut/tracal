import { describe, expect, it } from "vitest";
import { calculateTrade } from "@/lib/calculation/calculateTrade";
import { requiredSellPrice } from "@/lib/calculation/requiredSellPrice";

const baseInput = {
  capitalThb: "3300",
  buyPriceUsd: "1",
  buyFee: { mode: "fixed" as const, value: "0" },
  sellFee: { mode: "fixed" as const, value: "0" },
  usdThb: "33",
};

describe("requiredSellPrice", () => {
  it("finds the sell price that hits a target profit", () => {
    // 3300 THB = 100 USD buys 100 units; +3300 THB profit needs 200 USD net.
    expect(requiredSellPrice({ ...baseInput, targetProfitThb: "3300" })).toBeCloseTo(2, 10);
  });

  it("matches the break-even price when the target profit is zero", () => {
    const percentFees = {
      ...baseInput,
      buyFee: { mode: "percent" as const, value: "1" },
      sellFee: { mode: "percent" as const, value: "1" },
    };
    const breakEven = calculateTrade({ ...percentFees, sellPriceUsd: "1" }).breakEvenSellPriceUsd;
    expect(requiredSellPrice({ ...percentFees, targetProfitThb: "0" })).toBeCloseTo(breakEven, 10);
  });

  it("accepts a negative target for a capped loss", () => {
    // Accepting a 660 THB (20 USD) loss means netting 80 USD off 100 units.
    expect(requiredSellPrice({ ...baseInput, targetProfitThb: "-660" })).toBeCloseTo(0.8, 10);
  });

  it("round-trips through calculateTrade", () => {
    const input = {
      ...baseInput,
      buyFee: { mode: "percent" as const, value: "0.1" },
      sellFee: { mode: "percent" as const, value: "0.1" },
    };
    const price = requiredSellPrice({ ...input, targetProfitThb: "1000" });
    const result = calculateTrade({ ...input, sellPriceUsd: price.toString() });
    expect(result.profitThb).toBeCloseTo(1000, 6);
  });

  it("returns zero when there is no position to sell", () => {
    expect(requiredSellPrice({ ...baseInput, capitalThb: "0", targetProfitThb: "100" })).toBe(0);
  });

  it("rejects invalid inputs", () => {
    expect(() => requiredSellPrice({ ...baseInput, buyPriceUsd: "0", targetProfitThb: "0" }))
      .toThrow(/ราคาซื้อ/);
    expect(() => requiredSellPrice({ ...baseInput, usdThb: "0", targetProfitThb: "0" }))
      .toThrow(/USD\/THB/);
  });
});
