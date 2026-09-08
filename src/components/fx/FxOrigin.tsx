import type { FxMeta } from "@/lib/plans/schema";
export function FxOrigin({ label, meta }: { label: string; meta: FxMeta }) {
  return <p className="help-text">{label}: {meta.kind === "manual" ? "ผู้ใช้กรอกเอง" : meta.kind === "legacy-manual-unverified" ? "เรต manual เดิมที่ยังต้องตรวจสอบ" : <>{meta.source} · วันที่อ้างอิง {meta.referenceDate ?? "ผู้ให้บริการไม่ระบุ"}<br />คัดจากข้อมูลที่ดึง {meta.fetchedAt ? new Date(meta.fetchedAt).toLocaleString("th-TH") : "—"}{meta.stale ? " · ข้อมูลเก่า" : ""}</>}</p>;
}
