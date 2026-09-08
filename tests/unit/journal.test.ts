import { beforeEach, describe, expect, it } from "vitest";
import { journalTotals, validateJournal } from "@/lib/calculation/journal";
import { exportJournalCsv, importJournalCsv, csvRows } from "@/lib/journal/csv";
import { mergeJournal, saveJournal, loadJournal } from "@/lib/journal/storage";
import type { Transaction } from "@/lib/journal/schema";
import { D } from "@/lib/calculation/v2";
const buy: Transaction = { id: "a", occurredAt: "2026-09-01T00:00:00.000Z", asset: "BTC", quoteCurrency: "USD", side: "buy", quantity: "1", price: "100", feeQuote: "0", fx: "35", extraCostThb: "0" };
const second: Transaction = { ...buy, id: "b", occurredAt: "2026-09-02T00:00:00.000Z", price: "200", fx: "30" };
const sell: Transaction = { ...buy, id: "c", occurredAt: "2026-09-03T00:00:00.000Z", side: "sell", quantity: "0.5", price: "300", fx: "32", feeQuote: "1" };
beforeEach(() => localStorage.clear());
describe("weighted average ledger", () => {
  it("allocates THB and quote costs independently for partial exits", () => {
    const r = journalTotals([buy, second, sell], { price: "250", fx: "31" });
    expect(r).toMatchObject({ quantity: "1.5", remainingCostThb: "7125", remainingCostQuote: "225", realizedThb: "2393", realizedQuote: "74", unrealizedThb: "4500" });
    expect(new D(r.netCashThb).plus(new D(r.quantity).times(250).times(31)).toFixed()).toBe(new D(r.realizedThb).plus(r.unrealizedThb!).toFixed());
  });
  it("clears all remaining cost on full exit and allows a new position", () => {
    const r = journalTotals([buy, second, sell, { ...sell, id: "d", quantity: "1.5", occurredAt: "2026-09-04T00:00:00.000Z" }]);
    expect(r.quantity).toBe("0"); expect(r.remainingCostThb).toBe("0"); expect(r.remainingCostQuote).toBe("0");
    expect(r.realizedThb).toBe(r.netCashThb);
  });
  it("rejects overselling and mixed accounting currencies", () => {
    expect(() => journalTotals([sell])).toThrow(/เกิน/);
    expect(() => journalTotals([buy, { ...second, quoteCurrency: "USDT" }])).toThrow();
    expect(() => validateJournal([buy, buy])).toThrow(/ซ้ำ/);
  });
});
describe("CSV and local journal", () => {
  it("exports and restores exact records with idempotent imports", () => {
    const rows = [buy, second, sell]; const parsed = importJournalCsv(exportJournalCsv(rows), { format: "tracal" });
    expect(parsed.errors).toEqual([]); expect(parsed.transactions).toEqual(rows);
    const merged = mergeJournal(rows, parsed.transactions); expect(merged.duplicates).toBe(3); expect(merged.transactions).toHaveLength(3);
    saveJournal(localStorage, merged.transactions); expect(loadJournal(localStorage)).toEqual(rows);
  });
  it("supports quoted CSV fields, escapes formulas, and rejects broken files", () => {
    expect(csvRows('\uFEFF"a,b",c\r\n"x""y",z')).toEqual([["a,b", "c"], ['x"y', "z"]]);
    const t = { ...buy, id: '=HYPERLINK("bad")' };
    const raw = exportJournalCsv([t]); expect(raw).toContain("'=HYPERLINK"); expect(importJournalCsv(raw, { format: "tracal" }).transactions[0].id).toBe(t.id);
    expect(() => csvRows('"unclosed')).toThrow(); expect(() => csvRows(" ".repeat(1_048_577))).toThrow();
  });
  it("validates Binance profile fee currency and UTC without silently dropping rows", () => {
    const header = "Date(UTC),Pair,Side,Price,Executed,Fee\n";
    const good = "2026-09-01 12:00:00,BTCUSDT,BUY,100USDT,1BTC,0.1USDT";
    const parsed = importJournalCsv(header + good, { format: "binance", fx: "35" });
    expect(parsed.errors).toEqual([]); expect(parsed.transactions[0]).toMatchObject({ asset: "BTC", quoteCurrency: "USDT", price: "100", quantity: "1", fx: "35", occurredAt: "2026-09-01T12:00:00.000Z" });
    expect(importJournalCsv(header + good.replace("0.1USDT", "0.1BNB"), { format: "binance", fx: "35" }).errors).toHaveLength(1);
    expect(importJournalCsv(header + good.replace("2026-09-01", "2026-02-30"), { format: "binance", fx: "35" }).errors).toHaveLength(1);
    expect(importJournalCsv(header + good, { format: "binance" }).errors).toHaveLength(1);
  });
  it("keeps separate fills with identical timestamps while reimport stays idempotent", () => {
    const row = "2026-09-01 12:00:00,BTCUSDT,BUY,100USDT,1BTC,0.1USDT";
    const parsed = importJournalCsv("Date(UTC),Pair,Side,Price,Executed,Fee\n" + row + "\n" + row, { format: "binance", fx: "35" });
    expect(new Set(parsed.transactions.map((t) => t.id)).size).toBe(2);
    expect(mergeJournal(parsed.transactions, parsed.transactions).duplicates).toBe(2);
  });
  it("does not overwrite on conflicting IDs or invalid ledger", () => {
    saveJournal(localStorage, [buy]); expect(() => mergeJournal([buy], [{ ...buy, price: "101" }])).toThrow();
    expect(() => saveJournal(localStorage, [sell])).toThrow(); expect(loadJournal(localStorage)).toEqual([buy]);
  });
});
