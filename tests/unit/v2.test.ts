import { describe, expect, it } from "vitest";
import { calculate, targetPrice, sensitivity, sizeRisk, D, goldQuantity, type TradeInput } from "@/lib/calculation/v2";
const base: TradeInput = { quoteCurrency: "USD", capitalThb: "35000", buyPrice: "1000", sellPrice: "1100", buyFx: "35", sellFx: "31", buyFee: { mode: "fixed", value: "0" }, sellFee: { mode: "fixed", value: "0" }, buyConversionCostThb: "0", sellConversionCostThb: "0" };
describe("v2 cash flows", () => {
  it("A: maintains same-FX behavior", () => expect(calculate({ ...base, capitalThb: "34000", buyPrice: "50000", sellPrice: "60000", buyFx: "34", sellFx: "34" })).toMatchObject({ quantity: "0.02", tradeProfit: "200", profitThb: "6800", roiThbPercent: "20", breakEvenThb: "50000" }));
  it("B: USD profit can be a THB loss", () => expect(calculate(base)).toMatchObject({ quantity: "1", tradeProfit: "100", profitThb: "-900", netSellThb: "34100", priceEffectThb: "3500", fxEffectThb: "-4400" }));
  it("C: includes percent fees", () => {
    const r = calculate({ ...base, capitalThb: "3300", buyPrice: "1", sellPrice: "2", buyFx: "33", sellFx: "33", buyFee: { mode: "percent", value: "0.1" }, sellFee: { mode: "percent", value: "0.1" } });
    expect(new D(r.profitThb).minus("3286.8131868132").abs().lt("0.00000001")).toBe(true);
  });
  it("D: reconciles fixed costs and attribution", () => {
    const r = calculate({ ...base, capitalThb: "35350", buyFee: { mode: "fixed", value: "5" }, sellFee: { mode: "fixed", value: "10" }, buyConversionCostThb: "175", sellConversionCostThb: "100" });
    expect(r).toMatchObject({ capitalQuote: "1005", quantity: "1", netSell: "1090", netSellThb: "33690", profitThb: "-1660", tradeProfit: "85", feesThb: "760" });
  });
  it.each(["fixed", "percent"] as const)("round-trips target with %s fees and distinct FX", (mode) => {
    const input = { ...base, buyFee: { mode, value: "0.3" }, sellFee: { mode, value: "0.5" }, buyConversionCostThb: "10", sellConversionCostThb: "20" };
    for (const target of ["0", "3100", "-1000"]) {
      const p = targetPrice(input, target);
      expect(p.error).toBeNull();
      const result = calculate({ ...input, sellPrice: p.price! });
      expect(new D(result.profitThb).minus(target).abs().lt("0.00000001")).toBe(true);
      expect(new D(result.priceEffectThb).plus(result.fxEffectThb).minus(result.feesThb).minus(result.profitThb).abs().lt("0.00000001")).toBe(true);
    }
  });
  it("does not invent unreachable prices or zero positions", () => {
    expect(targetPrice(base, "-36000").price).toBeNull();
    for (const patch of [{ capitalThb: "0" }, { buyFx: "0" }, { buyFee: { mode: "percent" as const, value: "100" } }, { capitalThb: "10", buyConversionCostThb: "10" }, { sellPrice: "Infinity" }]) expect(() => calculate({ ...base, ...patch })).toThrow();
  });
  it("keeps quantity fixed under exit FX and reuses engine for sensitivity", () => {
    expect(calculate({ ...base, sellFx: "100" }).quantity).toBe(calculate(base).quantity);
    for (const row of sensitivity(base)) expect(row.profitThb).toBe(calculate({ ...base, sellPrice: row.sellPrice }).profitThb);
  });
  it("handles zero sale and small/large decimal inputs without Number boundaries", () => {
    expect(calculate({ ...base, sellPrice: "0", sellFee: { mode: "fixed", value: "10" } }).netSell).toBe("-10");
    const r = calculate({ ...base, capitalThb: "999999999999999999", buyPrice: "0.000000000001", sellPrice: "0.000000000002", buyFx: "1", sellFx: "1" });
    expect(r.profitThb).toBe("999999999999999999");
  });
  it("keeps USDT as a distinct quote and converts gold quantities", () => {
    expect(calculate({ ...base, quoteCurrency: "USDT" }).profitThb).toBe("-900");
    expect(goldQuantity("1", "g")).toBe("31.1034768");
  });
});
describe("risk sizing", () => {
  const input = { ...base, buyPrice: "100", buyFx: "35", sellFx: "35" };
  it("caps risk and capital independently", () => {
    expect(sizeRisk(input, "90", "700", "10000")).toEqual({ quantity: "2", capitalThb: "7000", expectedLossThb: "700" });
    expect(sizeRisk(input, "90", "700", "3500")).toEqual({ quantity: "1", capitalThb: "3500", expectedLossThb: "350" });
  });
  it("includes all fees and validates the returned capital with forward engine", () => {
    const i = { ...input, sellFx: "34", buyFee: { mode: "percent" as const, value: "0.1" }, sellFee: { mode: "fixed" as const, value: "1" }, buyConversionCostThb: "10", sellConversionCostThb: "15" };
    const r = sizeRisk(i, "90", "700", "5000");
    expect(new D(r.capitalThb).lte(5000)).toBe(true);
    expect(new D(calculate({ ...i, capitalThb: r.capitalThb, sellPrice: "90" }).profitThb).negated().lte(700)).toBe(true);
  });
  it("rejects invalid stops, non-positive downside and unaffordable fees", () => {
    expect(() => sizeRisk(input, "100", "700", "10000")).toThrow();
    expect(() => sizeRisk({ ...input, sellFx: "50" }, "90", "700", "10000")).toThrow(/downside/);
    expect(() => sizeRisk({ ...input, buyConversionCostThb: "701" }, "90", "700", "10000")).toThrow();
  });
});
