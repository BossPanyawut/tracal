import Decimal from "decimal.js";
import { z } from "zod";

export const D = Decimal.clone({ precision: 80, rounding: Decimal.ROUND_HALF_UP, toExpNeg: -100, toExpPos: 100 });
export const CALCULATION_VERSION = "2.0";
export const numericText = z.string().regex(/^\d{1,18}(\.\d{0,12})?$/, "ใช้ตัวเลขไม่เกิน 18 หลักและทศนิยม 12 ตำแหน่ง");
export const signedNumericText = z.string().regex(/^-?\d{1,18}(\.\d{0,12})?$/, "กำไรเป้าหมายต้องเป็นตัวเลข");
export const feeSchema = z.object({ mode: z.enum(["fixed", "percent"]), value: numericText });
export type Fee = z.infer<typeof feeSchema>;
export type QuoteCurrency = "USD" | "USDT";
export type TradeInput = {
  quoteCurrency: QuoteCurrency;
  capitalThb: string;
  buyPrice: string;
  sellPrice: string;
  buyFx: string;
  sellFx: string;
  buyFee: Fee;
  sellFee: Fee;
  buyConversionCostThb: string;
  sellConversionCostThb: string;
};

/** Internal decimals also accept the full precision produced by reverse calculations. */
export function amount(value: string, label = "จำนวน", positive = false): Decimal {
  if (!/^-?\d{1,100}(\.\d{0,100})?$/.test(value)) throw new Error(`${label}ต้องเป็นตัวเลข`);
  const n = new D(value);
  if (!n.isFinite() || n.isNegative() || (positive && n.isZero())) throw new Error(`${label}ต้อง${positive ? "มากกว่า 0" : "ไม่ติดลบ"}`);
  return n;
}
export function feeParts(fee: Fee) {
  const value = amount(fee.value, "ค่าธรรมเนียม");
  if (fee.mode === "percent" && value.gte(100)) throw new Error("ค่าธรรมเนียมต้องน้อยกว่า 100%");
  return fee.mode === "percent" ? { rate: value.div(100), fixed: new D(0) } : { rate: new D(0), fixed: value };
}
export function position(input: TradeInput) {
  const capital = amount(input.capitalThb, "เงินทุน", true);
  const buyFx = amount(input.buyFx, "เรตซื้อ", true);
  const sellFx = amount(input.sellFx, "เรตขาย", true);
  const buyPrice = amount(input.buyPrice, "ราคาซื้อ", true);
  const entryCost = amount(input.buyConversionCostThb, "ค่าใช้จ่ายขาเข้า");
  const exitCost = amount(input.sellConversionCostThb, "ค่าใช้จ่ายขาออก");
  const buyFee = feeParts(input.buyFee);
  const sellFee = feeParts(input.sellFee);
  const budget = capital.minus(entryCost).div(buyFx);
  const grossBuy = budget.minus(buyFee.fixed).div(buyFee.rate.plus(1));
  if (grossBuy.lte(0)) throw new Error("เงินทุนต้องมากกว่าค่าธรรมเนียมและค่าใช้จ่ายขาเข้า");
  return { capital, buyFx, sellFx, buyPrice, entryCost, exitCost, budget, grossBuy,
    quantity: grossBuy.div(buyPrice), buyFee: budget.minus(grossBuy), sellFee };
}
export function priceForNet(quantity: Decimal, fee: ReturnType<typeof feeParts>, net: Decimal) {
  return net.plus(fee.fixed).div(quantity.times(new D(1).minus(fee.rate)));
}
export function calculate(input: TradeInput) {
  const p = position(input);
  const sell = amount(input.sellPrice, "ราคาขาย");
  const grossSell = p.quantity.times(sell);
  const sellFee = grossSell.times(p.sellFee.rate).plus(p.sellFee.fixed);
  const netSell = grossSell.minus(sellFee);
  const netSellThb = netSell.times(p.sellFx).minus(p.exitCost);
  const profitThb = netSellThb.minus(p.capital);
  const tradeProfit = netSell.minus(p.budget);
  const fields = {
    quantity: p.quantity, capitalQuote: p.budget, grossBuy: p.grossBuy, buyFee: p.buyFee,
    grossSell, sellFee, netSell, netSellThb, totalCostThb: p.capital, tradeProfit, profitThb,
    roiThbPercent: profitThb.div(p.capital).times(100), roiQuotePercent: tradeProfit.div(p.budget).times(100),
    breakEvenThb: priceForNet(p.quantity, p.sellFee, p.capital.plus(p.exitCost).div(p.sellFx)),
    breakEvenQuote: priceForNet(p.quantity, p.sellFee, p.budget),
    priceEffectThb: p.quantity.times(sell.minus(p.buyPrice)).times(p.buyFx),
    fxEffectThb: grossSell.times(p.sellFx.minus(p.buyFx)),
    feesThb: p.buyFee.times(p.buyFx).plus(sellFee.times(p.sellFx)).plus(p.entryCost).plus(p.exitCost),
  };
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.toFixed()])) as { [K in keyof typeof fields]: string };
}
export type TradeResult = ReturnType<typeof calculate>;
export function targetPrice(input: TradeInput, targetThb: string): { price: string; error: null } | { price: null; error: string } {
  signedNumericText.parse(targetThb);
  const p = position(input);
  const net = p.capital.plus(targetThb).plus(p.exitCost).div(p.sellFx);
  const price = priceForNet(p.quantity, p.sellFee, net);
  return price.isNegative() ? { price: null, error: "เป้าหมายนี้ต้องใช้ราคาขายติดลบ จึงทำไม่ได้ในแบบจำลอง Spot" } : { price: price.toFixed(), error: null };
}
export function sensitivity(input: TradeInput) {
  const base = amount(input.sellPrice);
  return [-10, -5, 0, 5, 10].map((step) => {
    const sellPrice = base.times(new D(1).plus(new D(step).div(100))).toFixed();
    return { step, sellPrice, ...calculate({ ...input, sellPrice }) };
  });
}
export function sizeRisk(input: TradeInput, stop: string, risk: string, cap: string) {
  const pb = amount(input.buyPrice, "ราคาซื้อ", true), ps = amount(stop, "Stop");
  const rb = amount(input.buyFx, "เรตซื้อ", true), rs = amount(input.sellFx, "เรตขาย", true);
  const r = amount(risk, "วงเงินขาดทุน", true), m = amount(cap, "เงินทุนสูงสุด", true);
  if (ps.gte(pb)) throw new Error("Stop ต้องต่ำกว่าราคาซื้อสำหรับ Long Spot");
  const buy = feeParts(input.buyFee), sell = feeParts(input.sellFee);
  const w = amount(input.buyConversionCostThb), e = amount(input.sellConversionCostThb);
  const a = pb.times(buy.rate.plus(1)).times(rb).minus(ps.times(new D(1).minus(sell.rate)).times(rs));
  const b = buy.fixed.times(rb).plus(sell.fixed.times(rs)).plus(w).plus(e);
  if (a.lte(0)) throw new Error("เรตและ Stop นี้ไม่ให้ downside ต่อหน่วยที่เป็นบวก จึงหาขนาดซื้อจากวงเงินขาดทุนไม่ได้");
  if (r.lte(b)) throw new Error("วงเงินขาดทุนไม่พอสำหรับค่าใช้จ่ายคงที่");
  const qCap = m.minus(w).minus(buy.fixed.times(rb)).div(pb.times(buy.rate.plus(1)).times(rb));
  const q = D.min(r.minus(b).div(a), qCap).toDecimalPlaces(12, D.ROUND_DOWN);
  if (q.lte(0)) throw new Error("เงินทุนไม่พอหรือจำนวนต่ำกว่าความละเอียดที่รองรับ");
  // Round capital down so applying the plan cannot increase risk or exceed the cap.
  const capital = q.times(pb).times(buy.rate.plus(1)).plus(buy.fixed).times(rb).plus(w).toDecimalPlaces(12, D.ROUND_DOWN);
  const result = calculate({ ...input, capitalThb: capital.toFixed(), sellPrice: stop });
  return { quantity: result.quantity, capitalThb: capital.toFixed(), expectedLossThb: new D(result.profitThb).negated().toFixed() };
}
export const GRAMS_PER_TROY_OUNCE = "31.1034768";
export function goldQuantity(ounces: string, unit: "oz" | "g") {
  return unit === "g" ? amount(ounces).times(GRAMS_PER_TROY_OUNCE).toFixed() : ounces;
}
