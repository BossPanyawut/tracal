"use client";
/* eslint-disable react-hooks/set-state-in-effect -- Restore browser-only plans after hydration. */
import { useEffect, useRef, useState } from "react";
import { newDraft, type Draft, type Plan } from "@/lib/plans/schema";
import { appendPlans, createPlan, exportPlans, loadPlans, MAX_IMPORT_BYTES, parseBackup, PLANS_KEY, savePlans } from "@/lib/plans/storage";
import { money } from "@/lib/calculation/format";
export function downloadText(name: string, text: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function PlanManager({ draft, onOpen, onNew, canSave, resetVersion }: { draft: Draft; onOpen: (plan: Plan) => void; onNew: () => void; canSave: boolean; resetVersion: number }) {
  const [plans, setPlans] = useState<Plan[]>([]), [name, setName] = useState("");
  const [active, setActive] = useState<Plan | null>(null), [ready, setReady] = useState(false);
  const [message, setMessage] = useState(""), [preview, setPreview] = useState<Plan[] | null>(null);
  const [recoveryRaw, setRecoveryRaw] = useState<string | null>(null);
  const [pending, setPending] = useState<Plan | "new" | null>(null), [deleting, setDeleting] = useState<string | null>(null);
  const [draftAtOpen, setDraftAtOpen] = useState(JSON.stringify(draft));
  const previousResetVersion = useRef(resetVersion);
  const dirty = JSON.stringify(draft) !== draftAtOpen || (active !== null && name !== active.name);
  useEffect(() => { try { setPlans(loadPlans(localStorage)); setReady(true); } catch { setRecoveryRaw(localStorage.getItem(PLANS_KEY)); setMessage("อ่านรายการแผนไม่ได้ จึงหยุดการเขียนทับ ดาวน์โหลดข้อมูลดิบไว้ก่อนแก้ไข"); } }, []);
  useEffect(() => {
    if (previousResetVersion.current === resetVersion) return;
    previousResetVersion.current = resetVersion;
    setActive(null); setName(""); setDraftAtOpen(JSON.stringify(newDraft())); setPending(null);
  }, [resetVersion]);
  function commit(next: Plan[]) { savePlans(localStorage, next); setPlans(next); }
  function save(asNew = false) {
    try { const plan = createPlan(name, draft, asNew ? undefined : active ?? undefined);
      const next = active && !asNew ? plans.map((p) => p.id === active.id ? plan : p) : [...plans, plan];
      commit(next); setActive(plan); setDraftAtOpen(JSON.stringify(draft)); setMessage("บันทึกแผนแล้ว");
    } catch (e) { setMessage(e instanceof Error ? e.message.startsWith("[") ? "ตรวจชื่อแผนและข้อมูลคำนวณก่อนบันทึก" : e.message : "บันทึกไม่ได้ พื้นที่จัดเก็บอาจเต็ม"); }
  }
  function open(plan: Plan | "new") {
    if (plan === "new") { setActive(null); setName(""); onNew(); setDraftAtOpen(JSON.stringify(newDraft())); }
    else { setActive(plan); setName(plan.name); setDraftAtOpen(JSON.stringify(plan.input)); onOpen(plan); }
    setPending(null);
  }
  return <section className="workspace-panel" aria-label="แผนที่บันทึก">
    <div className="section-header"><div><h2>แผนของฉัน</h2><p className="help-text">เก็บใน browser นี้ · {plans.length}/100 แผน · {dirty ? "มีการเปลี่ยนแปลงที่ยังไม่บันทึก" : "ข้อมูลตรงกับแผนที่เปิด"}</p></div><button type="button" className="quiet-button" onClick={() => dirty ? setPending("new") : open("new")}>แผนใหม่</button></div>
    <div className="plan-save-row"><label className="text-field">ชื่อแผน<input aria-label="ชื่อแผน" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น BTC แผนเดือนนี้" /></label><button type="button" className="primary-cta" disabled={!ready || !canSave || !name.trim()} onClick={() => save()}>บันทึกแผน</button>{active && <button type="button" className="quiet-button" disabled={!ready || !canSave} onClick={() => save(true)}>ทำสำเนา</button>}</div>
    {message && <p className="notice" role="status">{message}</p>}
    {recoveryRaw !== null && <button type="button" className="quiet-button" onClick={() => downloadText("tracal-plans-recovery.txt", recoveryRaw, "text/plain;charset=utf-8")}>ดาวน์โหลดข้อมูลแผนดิบ</button>}
    {pending && <div className="notice" role="alert"><p>เก็บ draft ที่กำลังแก้โดยบันทึกเป็นแผนก่อน หรือเลือกทิ้งการแก้ไขแล้วเปิดรายการที่เลือก</p><button type="button" className="quiet-button" onClick={() => open(pending)}>ทิ้งการแก้ไขและเปิด</button><button type="button" className="quiet-button" onClick={() => setPending(null)}>กลับไปบันทึก</button></div>}
    <ul className="plan-list">{plans.map((p) => <li key={p.id}><button className="plan-open" type="button" onClick={() => dirty ? setPending(p) : open(p)}><strong>{p.name}</strong><span>{p.input.asset} · {money(p.result.profitThb, "THB", true)} · {new Date(p.updatedAt).toLocaleDateString("th-TH")}</span></button><button type="button" aria-label={`ลบ ${p.name}`} className="quiet-button" onClick={() => setDeleting(p.id)}>ลบ</button></li>)}</ul>
    {plans.length === 0 && <p className="help-text">บันทึกแผนแรกเพื่อกลับมาเปรียบเทียบภายหลัง</p>}
    {deleting && <div className="notice" role="alert"><p>ลบแผนที่เลือก? สำรองไฟล์ได้ก่อนลบ</p><button type="button" className="quiet-button" onClick={() => { try { commit(plans.filter((p) => p.id !== deleting)); if (active?.id === deleting) setActive(null); setDeleting(null); } catch { setMessage("ลบไม่ได้ ข้อมูลเดิมยังอยู่"); } }}>ยืนยันลบแผน</button><button type="button" className="quiet-button" onClick={() => setDeleting(null)}>ยกเลิก</button></div>}
    <div className="action-row"><button type="button" className="quiet-button" disabled={!ready} onClick={() => downloadText("tracal-plans.json", exportPlans(plans))}>สำรอง JSON</button><label className="file-button">นำเข้า JSON<input aria-label="นำเข้า JSON" type="file" accept=".json,application/json" disabled={!ready} onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; try { if (file.size > MAX_IMPORT_BYTES) throw new Error("ไฟล์ต้องไม่เกิน 1 MiB"); setPreview(parseBackup(await file.text())); } catch (error) { setMessage(error instanceof Error ? error.message : "อ่านไฟล์ไม่ได้"); } }} /></label></div>
    {preview && <div className="notice"><p>พร้อมเพิ่ม {preview.length} แผน · ID ที่ซ้ำจะสร้างใหม่ · ไม่ทับแผนเดิม</p><button type="button" className="quiet-button" onClick={() => { try { commit(appendPlans(plans, preview)); setPreview(null); setMessage("นำเข้าแผนแล้ว"); } catch (error) { setMessage(error instanceof Error ? error.message : "นำเข้าไม่ได้"); } }}>ยืนยันนำเข้าแผน</button><button type="button" className="quiet-button" onClick={() => setPreview(null)}>ยกเลิกนำเข้า</button></div>}
  </section>;
}
