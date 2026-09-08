import { z } from "zod";
import { signedNumericText, feeSchema, type TradeInput, type TradeResult, calculate } from "@/lib/calculation/v2";

const draftNumber = z.string().regex(/^\d{0,18}(\.\d{0,12})?$/);
const draftFee = feeSchema.extend({ value: draftNumber });
export const fxMetaSchema = z.object({
  kind: z.enum(["manual", "reference", "legacy-manual-unverified"]),
  source: z.string().max(100).optional(),
  referenceDate: z.iso.date().optional(),
  fetchedAt: z.iso.datetime().optional(),
  stale: z.boolean().optional(),
}).refine((m) => m.kind !== "reference" || Boolean(m.source && m.fetchedAt && m.stale !== undefined), "เรตอ้างอิงต้องมี source, fetchedAt และ stale");
export type FxMeta = z.infer<typeof fxMetaSchema>;
export const draftSchema = z.object({
  inputSchemaVersion: z.literal(2),
  quoteCurrency: z.enum(["USD", "USDT"]),
  asset: z.enum(["BTC", "ETH", "XAU", "CUSTOM"]),
  assetLabel: z.string().max(80),
  goldUnit: z.enum(["oz", "g"]),
  capitalThb: draftNumber, buyPrice: draftNumber, sellPrice: draftNumber,
  buyFx: draftNumber, sellFx: draftNumber, buyFee: draftFee, sellFee: draftFee,
  buyConversionCostThb: draftNumber, sellConversionCostThb: draftNumber,
  buyFxMeta: fxMetaSchema, sellFxMeta: fxMetaSchema,
  targetProfitThb: z.union([z.literal(""), signedNumericText]),
  stopPrice: draftNumber, riskBudgetThb: draftNumber, maxCapitalThb: draftNumber,
  sellPriceMeta: z.object({ source: z.string().max(100), fetchedAt: z.iso.datetime(), marketUpdatedAt: z.iso.datetime().nullable(), stale: z.boolean() }).optional(),
  migrationNotice: z.string().max(300).optional(),
}).superRefine((draft, ctx) => {
  if (draft.asset === "XAU" && draft.quoteCurrency !== "USD") ctx.addIssue({ code: "custom", message: "XAU ใช้ราคา USD ต่อ troy ounce", path: ["quoteCurrency"] });
  if (draft.quoteCurrency === "USDT" && (draft.buyFxMeta.kind === "reference" || draft.sellFxMeta.kind === "reference")) ctx.addIssue({ code: "custom", message: "USDT ต้องใช้เรตที่กรอกเอง ไม่ใช้ reference USD", path: ["buyFxMeta"] });
});
export type Draft = z.infer<typeof draftSchema>;
export function newDraft(): Draft {
  return {
    inputSchemaVersion: 2, quoteCurrency: "USD", asset: "BTC", assetLabel: "", goldUnit: "oz",
    capitalThb: "", buyPrice: "", sellPrice: "", buyFx: "", sellFx: "",
    buyFee: { mode: "percent", value: "0.100" }, sellFee: { mode: "percent", value: "0.100" },
    buyConversionCostThb: "0", sellConversionCostThb: "0",
    buyFxMeta: { kind: "manual" }, sellFxMeta: { kind: "manual" },
    targetProfitThb: "", stopPrice: "", riskBudgetThb: "", maxCapitalThb: "",
  };
}
export function toTradeInput(draft: Draft): TradeInput {
  draftSchema.parse(draft);
  return { ...draft, buyConversionCostThb: draft.buyConversionCostThb || "0", sellConversionCostThb: draft.sellConversionCostThb || "0" };
}
const resultKeys: (keyof TradeResult)[] = ["quantity", "capitalQuote", "grossBuy", "buyFee", "grossSell", "sellFee", "netSell", "netSellThb", "totalCostThb", "tradeProfit", "profitThb", "roiThbPercent", "roiQuotePercent", "breakEvenThb", "breakEvenQuote", "priceEffectThb", "fxEffectThb", "feesThb"];
export const snapshotSchema = z.record(z.string(), z.string().regex(/^-?\d{1,100}(\.\d{1,100})?$/)).refine((value) => resultKeys.every((key) => key in value), "ข้อมูลผลลัพธ์ไม่ครบ");
export const planSchema = z.object({
  id: z.string().min(1).max(100), name: z.string().trim().min(1).max(80),
  createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
  inputSchemaVersion: z.literal(2), calculationVersion: z.string().regex(/^\d+\.\d+$/).max(20),
  input: draftSchema, result: snapshotSchema,
}).superRefine((plan, ctx) => {
  try {
    const current = calculate(toTradeInput(plan.input));
    if (plan.calculationVersion === "2.0" && Object.entries(current).some(([key, value]) => plan.result[key] !== value)) {
      ctx.addIssue({ code: "custom", message: "ผลลัพธ์ snapshot ไม่ตรงกับ input", path: ["result"] });
    }
  }
  catch { ctx.addIssue({ code: "custom", message: "ข้อมูลแผนคำนวณไม่ได้", path: ["input"] }); }
});
export type Plan = z.infer<typeof planSchema>;
export const backupSchema = z.object({ format: z.literal("tracal-plans"), version: z.literal(2), plans: z.array(planSchema).max(100) });
