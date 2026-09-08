import { beforeEach, describe, expect, it, vi } from "vitest";
import { newDraft, draftSchema } from "@/lib/plans/schema";
import { appendPlans, createPlan, DRAFT_KEY, exportPlans, LEGACY_KEY, loadDraft, loadPlans, parseBackup, PLANS_KEY, savePlans } from "@/lib/plans/storage";
const draft = () => ({ ...newDraft(), capitalThb: "35000", buyPrice: "1000", sellPrice: "1100", buyFx: "35", sellFx: "31", buyFee: { mode: "fixed" as const, value: "0" }, sellFee: { mode: "fixed" as const, value: "0" } });
beforeEach(() => localStorage.clear());
describe("plan snapshots and backup", () => {
  it("round-trips decimal strings, names and provenance without changing FX", () => {
    const input = { ...draft(), buyFxMeta: { kind: "reference" as const, source: "BOT", referenceDate: "2026-09-01", fetchedAt: "2026-09-02T00:00:00.000Z", stale: true } };
    const plan = createPlan("BTC plan", input); savePlans(localStorage, [plan]);
    const restored = parseBackup(exportPlans(loadPlans(localStorage)));
    expect(restored).toEqual([plan]); expect(restored[0].result.profitThb).toBe("-900");
    expect(restored[0].input.buyFxMeta).toEqual(input.buyFxMeta);
  });
  it("does not mutate existing records when importing colliding IDs", () => {
    const plan = createPlan("same", draft()); const result = appendPlans([plan], [plan, plan]);
    expect(result[0]).toEqual(plan); expect(new Set(result.map((p) => p.id)).size).toBe(3);
  });
  it("rejects corrupt, too large and newer-schema files", () => {
    expect(() => parseBackup("{")).toThrow();
    expect(() => parseBackup(" ".repeat(1_048_577))).toThrow(/1 MiB/);
    expect(() => parseBackup(JSON.stringify({ format: "tracal-plans", version: 3, plans: [] }))).toThrow();
    const p = createPlan("plan", draft());
    expect(() => appendPlans(Array.from({ length: 100 }, (_, i) => ({ ...p, id: String(i) })), [p])).toThrow(/100/);
  });
  it("keeps storage untouched on invalid input or quota failure", () => {
    const p = createPlan("keep", draft()); savePlans(localStorage, [p]); const raw = localStorage.getItem(PLANS_KEY);
    expect(() => savePlans(localStorage, [{ ...p, inputSchemaVersion: 3 } as never])).toThrow();
    expect(localStorage.getItem(PLANS_KEY)).toBe(raw);
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("full", "QuotaExceededError"); });
    expect(() => savePlans(localStorage, [])).toThrow(); spy.mockRestore();
    expect(localStorage.getItem(PLANS_KEY)).toBe(raw);
  });
  it("keeps a different calculation version as a snapshot but validates inputs", () => {
    const p = { ...createPlan("older", draft()), calculationVersion: "1.9" };
    expect(parseBackup(JSON.stringify({ format: "tracal-plans", version: 2, plans: [p] }))[0].calculationVersion).toBe("1.9");
    expect(() => createPlan("bad", { ...draft(), buyFx: "0" })).toThrow();
  });
  it("rejects a tampered current-version snapshot", () => {
    const plan = createPlan("trusted", draft());
    expect(() => parseBackup(JSON.stringify({ format: "tracal-plans", version: 2, plans: [{ ...plan, result: { ...plan.result, profitThb: "999999" } }] }))).toThrow();
  });
  it("rejects USD reference metadata on USDT and ambiguous gold currencies", () => {
    expect(draftSchema.safeParse({ ...draft(), quoteCurrency: "USDT", buyFxMeta: { kind: "reference" } }).success).toBe(false);
    expect(draftSchema.safeParse({ ...draft(), asset: "XAU", quoteCurrency: "USDT" }).success).toBe(false);
  });
});
describe("v1 migration", () => {
  const legacy = (rate: string) => ({ capitalThb: "35000", buyPriceUsd: "1000", sellPriceUsd: "1100", buyFee: { mode: "fixed", value: "0" }, sellFee: { mode: "fixed", value: "0" }, manualUsdThb: rate, targetProfitThb: "0" });
  it("preserves v1 and marks old manual rates as unverified", () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy("35")));
    const first = loadDraft(localStorage); expect(first.draft.buyFx).toBe("35"); expect(first.draft.buyFxMeta.kind).toBe("legacy-manual-unverified");
    expect(localStorage.getItem(LEGACY_KEY)).not.toBeNull(); expect(loadDraft(localStorage).draft).toEqual(first.draft);
  });
  it("never invents the missing historical live rate", () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy("")));
    expect(loadDraft(localStorage)).toMatchObject({ restored: true, draft: { buyFx: "", sellFx: "" } });
  });
  it("retains originals if migration cannot write", () => {
    const raw = JSON.stringify(legacy("35")); localStorage.setItem(LEGACY_KEY, raw);
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(() => loadDraft(localStorage)).toThrow(); spy.mockRestore();
    expect(localStorage.getItem(LEGACY_KEY)).toBe(raw); expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });
  it("does not overwrite corrupt v2", () => {
    localStorage.setItem(DRAFT_KEY, "{broken"); expect(() => loadDraft(localStorage)).toThrow(); expect(localStorage.getItem(DRAFT_KEY)).toBe("{broken");
  });
});
