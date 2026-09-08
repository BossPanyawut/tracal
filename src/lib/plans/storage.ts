import { z } from "zod";
import { CALCULATION_VERSION, calculate, numericText } from "@/lib/calculation/v2";
import { backupSchema, draftSchema, newDraft, planSchema, toTradeInput, type Draft, type Plan } from "./schema";
export const DRAFT_KEY = "tracal.calculator.v2";
export const PLANS_KEY = "tracal.plans.v2";
export const LEGACY_KEY = "tracal.calculator.v1";
export const MAX_IMPORT_BYTES = 1_048_576;
const legacySchema = z.object({ capitalThb: z.string(), buyPriceUsd: z.string(), sellPriceUsd: z.string(),
  buyFee: z.object({ mode: z.enum(["fixed", "percent"]), value: z.string() }),
  sellFee: z.object({ mode: z.enum(["fixed", "percent"]), value: z.string() }), manualUsdThb: z.string(), targetProfitThb: z.string() });
export function writeVerified(storage: Storage, key: string, value: unknown) {
  const raw = JSON.stringify(value);
  storage.setItem(key, raw);
  if (storage.getItem(key) !== raw) throw new Error("ตรวจสอบข้อมูลที่บันทึกไม่ได้ กรุณาสำรองไฟล์");
}
export function loadDraft(storage: Storage): { draft: Draft; restored: boolean; warning?: string } {
  const raw = storage.getItem(DRAFT_KEY);
  if (raw) {
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new Error("ข้อมูล draft ไม่รองรับ เก็บต้นฉบับไว้และหยุดบันทึกอัตโนมัติ");
    return { draft: parsed.data, restored: true };
  }
  const legacy = storage.getItem(LEGACY_KEY);
  if (!legacy) return { draft: newDraft(), restored: false };
  let old: z.infer<typeof legacySchema>;
  try { old = legacySchema.parse(JSON.parse(legacy)); }
  catch { return { draft: newDraft(), restored: true, warning: "ข้อมูลเก่าไม่สมบูรณ์ เก็บต้นฉบับ v1 ไว้แล้ว" }; }
  const rate = numericText.safeParse(old.manualUsdThb).success && Number(old.manualUsdThb) > 0 ? old.manualUsdThb : "";
  const draft = draftSchema.parse({ ...newDraft(), capitalThb: old.capitalThb, buyPrice: old.buyPriceUsd,
    sellPrice: old.sellPriceUsd, buyFee: old.buyFee, sellFee: old.sellFee, targetProfitThb: old.targetProfitThb,
    buyFx: rate, sellFx: rate, buyFxMeta: { kind: rate ? "legacy-manual-unverified" : "manual" },
    sellFxMeta: { kind: rate ? "legacy-manual-unverified" : "manual" },
    migrationNotice: rate ? "ย้ายเรต manual เดิมมาแล้ว กรุณาตรวจสอบว่าเป็นเรตที่ใช้จริง" : "ข้อมูลเดิมไม่บันทึกเรตอ้างอิงย้อนหลัง กรุณากรอกหรือเลือกเรตใหม่" });
  writeVerified(storage, DRAFT_KEY, draft);
  return { draft, restored: true };
}
export function saveDraft(storage: Storage, draft: Draft) { writeVerified(storage, DRAFT_KEY, draftSchema.parse(draft)); }
export function loadPlans(storage: Storage): Plan[] {
  const raw = storage.getItem(PLANS_KEY);
  return raw ? backupSchema.parse(JSON.parse(raw)).plans : [];
}
export function savePlans(storage: Storage, plans: Plan[]) {
  const backup = backupSchema.parse({ format: "tracal-plans", version: 2, plans });
  if (new Blob([JSON.stringify(backup)]).size > MAX_IMPORT_BYTES) throw new Error("แผนรวมเกิน 1 MiB กรุณาสำรองแล้วลบแผนที่ไม่ใช้");
  writeVerified(storage, PLANS_KEY, backup);
}
export function createPlan(name: string, input: Draft, previous?: Plan): Plan {
  const now = new Date().toISOString();
  return planSchema.parse({ id: previous?.id ?? crypto.randomUUID(), name, input,
    inputSchemaVersion: 2, calculationVersion: CALCULATION_VERSION, result: calculate(toTradeInput(input)),
    createdAt: previous?.createdAt ?? now, updatedAt: now });
}
export function exportPlans(plans: Plan[]) { return JSON.stringify(backupSchema.parse({ format: "tracal-plans", version: 2, plans }), null, 2); }
export function parseBackup(raw: string) {
  if (new Blob([raw]).size > MAX_IMPORT_BYTES) throw new Error("ไฟล์ต้องไม่เกิน 1 MiB");
  try { return backupSchema.parse(JSON.parse(raw)).plans; }
  catch { throw new Error("ไฟล์สำรองไม่ถูกต้อง หรือเป็น schema รุ่นที่ยังไม่รองรับ"); }
}
export function appendPlans(existing: Plan[], imported: Plan[]) {
  if (existing.length + imported.length > 100) throw new Error("เก็บได้สูงสุด 100 แผน");
  const ids = new Set(existing.map((plan) => plan.id));
  return [...existing, ...imported.map((plan) => {
    const id = ids.has(plan.id) ? crypto.randomUUID() : plan.id;
    ids.add(id);
    return { ...plan, id };
  })];
}
