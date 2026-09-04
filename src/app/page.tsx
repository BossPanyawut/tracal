import { Calculator } from "@/components/calculator/Calculator";
import { FxTicker } from "@/components/fx/FxTicker";

export default function Home() {
  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="TRACAL home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>TRACAL</span>
        </a>
        <nav className="topbar-nav" aria-label="Main navigation">
          <a href="#calculator">Calculator</a>
        </nav>
        <a className="nav-cta" href="#calculator">Calculate now</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy-block">
          <p className="eyebrow">เครื่องคำนวณกำไรและจุดคุ้มทุน</p>
          <h1>Know your numbers.<br /><span>Trade with clarity.</span></h1>
          <p className="hero-copy">
            ใส่เงินทุนเป็นบาท ราคาซื้อและราคาขายต่อหน่วยเป็นดอลลาร์
            แล้วดูกำไร ขาดทุน และราคาขายคุ้มทุนพร้อมค่าธรรมเนียม
          </p>
          <div className="hero-actions">
            <a className="primary-cta" href="#calculator">เริ่มคำนวณ</a>
            <span>ไม่ต้องสมัครสมาชิก</span>
          </div>
        </div>
        <FxTicker />
      </section>

      <div id="calculator"><Calculator /></div>

      <footer className="footer">
        <div className="footer-brand">
          <span className="brand-mark dark" aria-hidden="true"><i /><i /><i /></span>
          <div><strong>TRACAL</strong><p>Trade cost &amp; profit calculator</p></div>
        </div>
        <p className="footer-disclaimer">ผลลัพธ์คำนวณจากตัวเลขที่กรอกเอง อาจต่างจากราคาที่ชำระจริง และไม่ใช่คำแนะนำด้านการลงทุน</p>
        <p className="footer-version">MVP 01 · 2026</p>
      </footer>
    </main>
  );
}
