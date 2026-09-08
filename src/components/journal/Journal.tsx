"use client";
/* eslint-disable react-hooks/set-state-in-effect -- Load local journal after hydration. */
import { useEffect, useMemo, useState } from "react";
import { transactionSchema, type Transaction } from "@/lib/journal/schema";
import { JOURNAL_KEY, loadJournal, mergeJournal, saveJournal } from "@/lib/journal/storage";
import { journalTotals } from "@/lib/calculation/journal";
import { exportJournalCsv, importJournalCsv } from "@/lib/journal/csv";
import { loadPlans } from "@/lib/plans/storage";
import { type Plan } from "@/lib/plans/schema";
import { D } from "@/lib/calculation/v2";
import { money, formatDecimal } from "@/lib/calculation/format";
import { NumberField } from "@/components/calculator/Fields";
import { downloadText } from "@/components/plans/PlanManager";
const emptyEntry = () => ({ date: "", asset: "BTC", quoteCurrency: "USD" as "USD" | "USDT", side: "buy" as "buy" | "sell", quantity: "", price: "", feeQuote: "0", fx: "", extraCostThb: "0" });
export function Journal() {
  const [transactions, setTransactions] = useState<Transaction[]>([]), [entry, setEntry] = useState(emptyEntry);
  const [ready, setReady] = useState(false), [message, setMessage] = useState("");
  const [recoveryRaw, setRecoveryRaw] = useState<string | null>(null);
  const [group, setGroup] = useState("BTC/USD"), [markPrice, setMarkPrice] = useState(""), [markFx, setMarkFx] = useState("");
  const [importFormat, setImportFormat] = useState<"tracal" | "binance">("tracal"), [importFx, setImportFx] = useState("");
  const [preview, setPreview] = useState<ReturnType<typeof importJournalCsv> | null>(null), [remove, setRemove] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]), [planId, setPlanId] = useState("");
  useEffect(() => { try { setTransactions(loadJournal(localStorage)); setReady(true); } catch { setRecoveryRaw(localStorage.getItem(JOURNAL_KEY)); setMessage("อ่านสมุดรายการไม่ได้ จึงหยุดการเขียนทับ ดาวน์โหลดข้อมูลดิบไว้ก่อนแก้ไข"); } }, []);
  const groups = [...new Set([group, ...transactions.map((t) => `${t.asset}/${t.quoteCurrency}`)])];
  const selected = useMemo(() => transactions.filter((t) => `${t.asset}/${t.quoteCurrency}` === group), [transactions, group]);
  const totals = useMemo(() => {
    try { return { data: journalTotals(selected, markPrice && markFx ? { price: markPrice, fx: markFx } : undefined), error: null }; }
    catch (e) { return { data: null, error: e instanceof Error ? e.message : "คำนวณรายการไม่ได้" }; }
  }, [selected, markPrice, markFx]);
  const currency = group.split("/")[1];
  const plan = plans.find((p) => p.id === planId && `${p.input.asset}/${p.input.quoteCurrency}` === group);
  function commit(next: Transaction[]) { saveJournal(localStorage, next); setTransactions(next); }
  function add() {
    try {
      if (!entry.date) throw new Error("กรอกวันและเวลารายการ");
      const occurredAt = new Date(entry.date).toISOString();
      const t = transactionSchema.parse({ ...entry, asset: entry.asset.trim().toUpperCase(), id: crypto.randomUUID(), occurredAt });
      commit([...transactions, t]); setGroup(`${t.asset}/${t.quoteCurrency}`); setMessage("บันทึกรายการแล้ว");
    } catch (e) { setMessage(e instanceof Error && !e.message.startsWith("[") ? e.message : "ตรวจจำนวน ราคา เรต และวันเวลา"); }
  }
  const set = (key: keyof ReturnType<typeof emptyEntry>, value: string) => setEntry((e) => ({ ...e, [key]: value }));
  return <section className="workspace-panel journal" aria-label="สมุดรายการซื้อขาย">
    <div className="section-header"><div><p className="eyebrow">รายการของฉัน</p><h2>ซื้อหลายไม้ ขายบางส่วน</h2><p className="help-text">ต้นทุนเฉลี่ยถ่วงน้ำหนัก · เก็บในเครื่อง · ราคาทอง XAU ใช้ USD ต่อ troy ounce และจำนวนเป็น ounce</p></div><span className="count-chip">{transactions.length}/1,000 รายการ</span></div>
    <details className="journal-entry" open><summary>เพิ่มรายการซื้อขายจริง</summary><div className="journal-form">
      <label className="text-field">วันและเวลา (เขตเวลาของอุปกรณ์)<input aria-label="วันเวลารายการ" type="datetime-local" step="1" value={entry.date} onChange={(e) => set("date", e.target.value)} /></label>
      <label className="text-field">สินทรัพย์<input aria-label="สินทรัพย์รายการ" maxLength={12} value={entry.asset} onChange={(e) => set("asset", e.target.value.toUpperCase())} /></label>
      <label className="text-field">สกุลเงิน<select aria-label="สกุลเงินรายการ" value={entry.quoteCurrency} onChange={(e) => set("quoteCurrency", e.target.value)}><option>USD</option><option>USDT</option></select></label>
      <label className="text-field">รายการ<select aria-label="ด้านรายการ" value={entry.side} onChange={(e) => set("side", e.target.value)}><option value="buy">ซื้อ</option><option value="sell">ขาย</option></select></label>
      <NumberField label="จำนวน" ariaLabel="จำนวนรายการ" value={entry.quantity} unit={entry.asset} onChange={(v) => set("quantity", v)} />
      <NumberField label="ราคาต่อหน่วย" ariaLabel="ราคารายการ" value={entry.price} unit={entry.quoteCurrency} onChange={(v) => set("price", v)} />
      <NumberField label="ค่าธรรมเนียมคงที่" ariaLabel="ค่าธรรมเนียมรายการ" value={entry.feeQuote} unit={entry.quoteCurrency} onChange={(v) => set("feeQuote", v)} />
      <NumberField label="เรตของรายการนี้" ariaLabel="เรตรายการ" value={entry.fx} unit={`THB/${entry.quoteCurrency}`} onChange={(v) => set("fx", v)} />
      <NumberField label="ค่าแปลงเงินเพิ่มเติม" ariaLabel="ค่าแปลงเงินรายการ" value={entry.extraCostThb} unit="THB" onChange={(v) => set("extraCostThb", v)} />
    </div><button type="button" className="primary-cta" disabled={!ready} onClick={add}>เพิ่มรายการ</button></details>
    {message && <p className="notice" role="status">{message}</p>}
    {recoveryRaw !== null && <button type="button" className="quiet-button" onClick={() => downloadText("tracal-journal-recovery.txt", recoveryRaw, "text/plain;charset=utf-8")}>ดาวน์โหลดข้อมูลสมุดดิบ</button>}
    <div className="journal-controls"><label className="text-field">สมุดสินทรัพย์<select aria-label="เลือกสมุดสินทรัพย์" value={group} onChange={(e) => { setGroup(e.target.value); setMarkPrice(""); setMarkFx(""); setPlanId(""); }}>{groups.map((g) => <option key={g}>{g}</option>)}</select></label><NumberField label="ราคาประเมินที่ยังไม่ขาย" ariaLabel="ราคาประเมิน" value={markPrice} unit={currency} onChange={setMarkPrice} /><NumberField label="เรตประเมิน" ariaLabel="เรตประเมิน" value={markFx} unit={`THB/${currency}`} onChange={setMarkFx} /></div>
    {totals.error && <p className="notice">{totals.error}</p>}
    {totals.data && <><div className="journal-stats"><div><span>ถือเหลือ</span><strong data-testid="journal-quantity">{formatDecimal(totals.data.quantity, 8)}</strong></div><div><span>ต้นทุนคงเหลือ THB</span><strong>{money(totals.data.remainingCostThb, "THB")}</strong></div><div><span>กำไรจากส่วนที่ขายแล้ว</span><strong data-testid="journal-realized">{money(totals.data.realizedThb, "THB", true)}</strong></div><div><span>กำไรประเมินส่วนที่ยังถือ</span><strong data-testid="journal-unrealized">{totals.data.unrealizedThb === null ? "รอราคาประเมิน" : money(totals.data.unrealizedThb, "THB", true)}</strong></div></div><p className="help-text">ต้นทุนเฉลี่ยรวมค่าธรรมเนียมเทรด {formatDecimal(totals.data.averageCostQuote, 8)} {currency}/หน่วย · ผลประเมินยังไม่หักค่าขายและค่าแปลงเงินในอนาคต · ไม่ใช่รายงานภาษี</p>
      <div className="table-scroll"><table className="journal-table"><thead><tr><th>เวลา</th><th>รายการ</th><th>จำนวน</th><th>ราคา {currency}</th><th>เรต THB</th><th>กำไรขายแล้ว THB</th><th>จัดการ</th></tr></thead><tbody>{totals.data.rows.map((t) => <tr key={t.id}><td>{new Date(t.occurredAt).toLocaleString("th-TH")}</td><td>{t.side === "buy" ? "ซื้อ" : "ขาย"}</td><td>{formatDecimal(t.quantity, 8)}</td><td>{money(t.price, currency)}</td><td>{formatDecimal(t.fx, 4)}</td><td>{t.side === "sell" ? money(t.realizedThb, "THB", true) : "—"}</td><td><button type="button" className="quiet-button" aria-label={`ลบรายการ ${t.id}`} onClick={() => setRemove(t.id)}>ลบ</button></td></tr>)}</tbody></table></div>
      <div className="action-row"><button type="button" className="quiet-button" onClick={() => { try { setPlans(loadPlans(localStorage)); setMessage("โหลดแผนสำหรับเปรียบเทียบแล้ว"); } catch { setMessage("อ่านแผนไม่ได้"); } }}>โหลดแผนเพื่อเทียบผลจริง</button>{plans.length > 0 && <label className="text-field">เทียบกับแผน<select aria-label="แผนเปรียบเทียบ" value={planId} onChange={(e) => setPlanId(e.target.value)}><option value="">เลือกแผนสินทรัพย์เดียวกัน</option>{plans.filter((p) => `${p.input.asset}/${p.input.quoteCurrency}` === group).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}</div>
      {plan && <p className="notice">กำไรตามแผน {money(plan.result.profitThb, "THB", true)} · กำไรขายแล้ว {money(totals.data.realizedThb, "THB", true)}{new D(totals.data.quantity).isZero() ? ` · ต่างจากแผน ${money(new D(totals.data.realizedThb).minus(plan.result.profitThb).toFixed(), "THB", true)}` : " · ยังถือบางส่วน จึงยังเทียบผลปิดแผนทั้งหมดไม่ได้"} · ตรวจว่าสมุดนี้มีเฉพาะรายการของแผนที่เลือก</p>}
    </>}
    {remove && <div className="notice"><p>ยืนยันลบรายการ? หากทำให้จำนวนที่ถือไม่พอขาย ระบบจะไม่ลบ</p><button type="button" className="quiet-button" onClick={() => { try { commit(transactions.filter((t) => t.id !== remove)); setRemove(null); } catch (e) { setMessage(e instanceof Error ? e.message : "ลบไม่ได้"); } }}>ยืนยันลบรายการ</button><button type="button" className="quiet-button" onClick={() => setRemove(null)}>ยกเลิก</button></div>}
    <details className="journal-import"><summary>นำเข้าและสำรอง CSV</summary><p className="help-text">ไฟล์ไม่เกิน 1 MiB · สูงสุด 1,000 รายการ · ตรวจทุกแถวก่อนบันทึก · CSV สำรองรวมข้อมูลทุกสินทรัพย์</p><div className="action-row"><button type="button" className="quiet-button" disabled={!ready} onClick={() => downloadText("tracal-journal.csv", exportJournalCsv(transactions), "text/csv;charset=utf-8")}>สำรอง CSV</button><button type="button" className="quiet-button" onClick={() => downloadText("tracal-template.csv", exportJournalCsv([]), "text/csv;charset=utf-8")}>ดาวน์โหลดหัวตาราง CSV</button></div>
      <label className="text-field">รูปแบบ CSV<select aria-label="รูปแบบ CSV" value={importFormat} onChange={(e) => { setImportFormat(e.target.value as "tracal" | "binance"); setPreview(null); }}><option value="tracal">TRACAL CSV (สำรอง/กรอกเอง)</option><option value="binance">Binance Spot: Date(UTC), Pair, Side, Price, Executed, Fee</option></select></label>
      {importFormat === "binance" && <><NumberField label="เรต THB สำหรับชุดนำเข้า" value={importFx} unit="THB/quote" onChange={(v) => { setImportFx(v); setPreview(null); }} /><p className="help-text">เป็นเรตสมมติที่คุณระบุใช้กับทุกรายการในไฟล์ ควรแยกไฟล์ตามเรตจริง ค่าธรรมเนียมต้องเป็นสกุล quote USD หรือ USDT; fee เป็น BNB/เหรียญจะถูกปฏิเสธ</p></>}
      <label className="file-button">เลือก CSV<input aria-label="นำเข้า CSV" type="file" accept=".csv,text/csv" disabled={!ready} onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; try { if (file.size > 1_048_576) throw new Error("ไฟล์ต้องไม่เกิน 1 MiB"); setPreview(importJournalCsv(await file.text(), { format: importFormat, fx: importFx })); } catch (error) { setPreview(null); setMessage(error instanceof Error ? error.message : "อ่าน CSV ไม่ได้"); } }} /></label>
      {preview && <div className="notice"><p>อ่านได้ {preview.transactions.length} รายการ · พบปัญหา {preview.errors.length} แถว</p>{preview.errors.length > 0 && <ul>{preview.errors.slice(0,20).map((e) => <li key={e}>{e}</li>)}</ul>}{preview.errors.length > 20 && <p>และอีก {preview.errors.length - 20} แถว กรุณาแก้ไฟล์ก่อนนำเข้า</p>}<div className="table-scroll"><table className="journal-table"><thead><tr><th>UTC</th><th>คู่เงิน</th><th>ด้าน</th><th>จำนวน</th><th>ราคา</th><th>Fee</th><th>เรต THB</th></tr></thead><tbody>{preview.transactions.slice(0,10).map((t,i) => <tr key={`${t.id}-${i}`}><td>{t.occurredAt}</td><td>{t.asset}/{t.quoteCurrency}</td><td>{t.side}</td><td>{t.quantity}</td><td>{t.price}</td><td>{t.feeQuote}</td><td>{t.fx}</td></tr>)}</tbody></table></div><p className="help-text">แสดงตัวอย่าง 10 แถวแรก รหัสซ้ำที่ข้อมูลเหมือนเดิมจะข้ามทั้งรายการ</p><button type="button" className="quiet-button" disabled={preview.errors.length > 0 || preview.transactions.length === 0} onClick={() => { try { const merged = mergeJournal(transactions, preview.transactions); commit(merged.transactions); setMessage(`นำเข้าแล้ว ข้ามรายการซ้ำ ${merged.duplicates} รายการ`); setPreview(null); } catch (e) { setMessage(e instanceof Error ? e.message : "นำเข้าไม่ได้"); } }}>ยืนยันนำเข้า CSV</button><button type="button" className="quiet-button" onClick={() => setPreview(null)}>ยกเลิกนำเข้า CSV</button></div>}
    </details>
  </section>;
}
