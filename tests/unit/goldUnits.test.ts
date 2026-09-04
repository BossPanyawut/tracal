import { describe, expect, it } from "vitest";
import { gramsToTroyOunces, toTroyOunces } from "@/lib/calculation/goldUnits";

describe("gold unit conversion", () => {
  it("converts exactly 31.1034768 grams to one troy ounce", () => {
    expect(gramsToTroyOunces("31.1034768").toNumber()).toBe(1);
  });

  it("keeps ounce quantities unchanged", () => {
    expect(toTroyOunces("0.25", "oz")).toBe("0.25");
  });
});
