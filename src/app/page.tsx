import { Calculator } from "@/components/calculator/Calculator";

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
          <a href="#market-data">Market data</a>
        </nav>
        <a className="nav-cta" href="#calculator">Calculate now</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy-block">
          <p className="eyebrow">CRYPTO · GOLD · FX</p>
          <h1>Know your numbers.<br /><span>Trade with clarity.</span></h1>
          <p className="hero-copy">
            คำนวณต้นทุน กำไร และจุดคุ้มทุนใน USD และ THB ด้วยราคาตลาดอ้างอิง
            หรือจำลองสถานการณ์ด้วยตัวเลขของคุณเอง
          </p>
          <div className="hero-actions">
            <a className="primary-cta" href="#calculator">เริ่มคำนวณ</a>
            <span>ไม่ต้องสมัครสมาชิก</span>
          </div>
        </div>
        <div className="hero-panel" id="market-data">
          <p>SUPPORTED MARKETS</p>
          <div><strong>BTC / ETH</strong><span>Crypto assets</span></div>
          <div><strong>XAU / USD</strong><span>Gold spot reference</span></div>
          <div><strong>USD / THB</strong><span>Market FX · BOT fallback</span></div>
          <small><i /> LIVE DATA WITH MANUAL FALLBACK</small>
        </div>
      </section>

      <div id="calculator"><Calculator /></div>

      <footer className="footer">
        <div className="footer-brand">
          <span className="brand-mark dark" aria-hidden="true"><i /><i /><i /></span>
          <div><strong>TRACAL</strong><p>Trade cost &amp; profit calculator</p></div>
        </div>
        <p className="footer-disclaimer">ราคาตลาดและอัตราแลกเปลี่ยนเป็นข้อมูลอ้างอิง อาจต่างจากราคาที่ชำระจริง และไม่ใช่คำแนะนำด้านการลงทุน</p>
        <p className="footer-version">MVP 01 · 2026</p>
      </footer>
    </main>
  );
}
