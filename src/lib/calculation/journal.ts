import { D, amount } from "./v2";
import { transactionSchema, type Transaction } from "@/lib/journal/schema";
export function journalTotals(transactions: Transaction[], mark?: { price: string; fx: string }) {
  let quantity = new D(0), costThb = new D(0), costQuote = new D(0), realizedThb = new D(0), realizedQuote = new D(0), feesThb = new D(0), netCashThb = new D(0);
  const sorted = transactions.map((t) => transactionSchema.parse(t)).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  if (new Set(sorted.map((t) => `${t.asset}/${t.quoteCurrency}`)).size > 1) throw new Error("ต้องแยกสมุดรายการตามสินทรัพย์และสกุลเงิน");
  const rows = sorted.map((t) => {
    const q = amount(t.quantity, "จำนวน", true), p = amount(t.price), fx = amount(t.fx, "เรต", true), fee = amount(t.feeQuote), extra = amount(t.extraCostThb);
    feesThb = feesThb.plus(fee.times(fx)).plus(extra);
    let pnl = new D(0);
    if (t.side === "buy") {
      const quote = q.times(p).plus(fee), thb = quote.times(fx).plus(extra);
      costQuote = costQuote.plus(quote); costThb = costThb.plus(thb); quantity = quantity.plus(q); netCashThb = netCashThb.minus(thb);
    } else {
      if (q.gt(quantity)) throw new Error(`ขาย ${t.asset} เกินจำนวนที่ถือ ณ ${t.occurredAt}`);
      const fraction = q.div(quantity), allocatedThb = q.eq(quantity) ? costThb : costThb.times(fraction), allocatedQuote = q.eq(quantity) ? costQuote : costQuote.times(fraction);
      const netQuote = q.times(p).minus(fee), netThb = netQuote.times(fx).minus(extra);
      pnl = netThb.minus(allocatedThb); realizedThb = realizedThb.plus(pnl); realizedQuote = realizedQuote.plus(netQuote.minus(allocatedQuote));
      costThb = costThb.minus(allocatedThb); costQuote = costQuote.minus(allocatedQuote); quantity = quantity.minus(q); netCashThb = netCashThb.plus(netThb);
    }
    return { ...t, realizedThb: pnl.toFixed(), remainingQuantity: quantity.toFixed() };
  });
  let unrealizedThb: string | null = null;
  if (mark) unrealizedThb = quantity.times(amount(mark.price)).times(amount(mark.fx, "เรตประเมิน", true)).minus(costThb).toFixed();
  return { rows, quantity: quantity.toFixed(), remainingCostThb: costThb.toFixed(), remainingCostQuote: costQuote.toFixed(),
    averageCostQuote: quantity.gt(0) ? costQuote.div(quantity).toFixed() : "0", realizedThb: realizedThb.toFixed(), realizedQuote: realizedQuote.toFixed(), feesThb: feesThb.toFixed(), netCashThb: netCashThb.toFixed(), unrealizedThb };
}
export function validateJournal(transactions: Transaction[]) {
  if (new Set(transactions.map((t) => t.id)).size !== transactions.length) throw new Error("พบรหัสรายการซ้ำ");
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) { const key = `${t.asset}/${t.quoteCurrency}`; groups.set(key, [...(groups.get(key) ?? []), t]); }
  for (const group of groups.values()) journalTotals(group);
}
