import type { FxQuote } from "@/lib/providers/types";
export function FxTicker({ quote, loading, error, onRefresh }: { quote: FxQuote | null; loading: boolean; error: boolean; onRefresh: () => void }) {
  return <aside className="reference-card" aria-label="อัตราแลกเปลี่ยนอ้างอิง">
    <div className="section-header"><h2>USD → THB อ้างอิง</h2><button className="quiet-button" type="button" disabled={loading} onClick={onRefresh}>{loading ? "กำลังโหลด…" : "รีเฟรชอ้างอิง"}</button></div>
    {quote && <><strong className="reference-value">{quote.rate.toLocaleString("th-TH", { maximumFractionDigits: 6 })} <small>บาท/USD</small></strong><p className="help-text">แหล่งข้อมูล {quote.source} · วันที่อ้างอิง {quote.referenceDate ?? "ผู้ให้บริการไม่ระบุ"}<br />ดึงข้อมูล {new Date(quote.fetchedAt).toLocaleString("th-TH")} {quote.stale ? "· ข้อมูลเก่า (stale)" : ""}</p></>}
    {error && <p className="notice" role="status">ดึงเรตใหม่ไม่ได้ ใช้เรตที่กรอกเองได้ทันที</p>}
    {!quote && !error && <p className="help-text">กรอกเรตเองได้ระหว่างรอข้อมูล</p>}
    <p className="help-text">การรีเฟรชไม่เปลี่ยนเรตในแผนที่กรอกแล้ว · เรตอ้างอิงไม่ใช่ราคาแลกเงินจริง</p>
  </aside>;
}
