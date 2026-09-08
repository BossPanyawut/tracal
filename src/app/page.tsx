import Link from "next/link";
import { LegacyHashRedirect } from "@/components/layout/LegacyHashRedirect";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

const tools = [
  { href: "/calculator", number: "01", title: "คำนวณและแผน", description: "ทดลองราคา เรตซื้อ–ขาย ค่าธรรมเนียม จุดคุ้มทุน และขนาดความเสี่ยง แล้วบันทึกหลายแผนไว้เทียบกัน", action: "เปิดเครื่องคำนวณ" },
  { href: "/journal", number: "02", title: "สมุดรายการ", description: "บันทึกซื้อหลายไม้ ขายบางส่วน ดูต้นทุนเฉลี่ยและกำไรที่เกิดขึ้นจริง พร้อมนำเข้าและสำรอง CSV", action: "เปิดสมุดรายการ" },
  { href: "/widget", number: "03", title: "Widget สำหรับเว็บไซต์", description: "ตั้งชื่อแบรนด์และสีหลัก แล้วสร้าง iframe เครื่องคำนวณสำหรับเว็บไซต์ของคุณ", action: "สร้าง Widget" },
];

export default function Home() {
  return (
    <div className="site-shell home-page">
      <LegacyHashRedirect />
      <SiteHeader active="home" />
      <main>
        <section className="hero" id="top">
          <div className="hero-copy-block">
            <p className="eyebrow">เครื่องมือวางแผนการซื้อขายสำหรับคนไทย</p>
            <h1>วางแผนให้ชัด<br /><span>ก่อนใช้เงินจริง</span></h1>
            <p className="hero-copy">แยกกำไรจากราคา ผลของค่าเงิน และค่าธรรมเนียม บันทึกแผนกับรายการจริงไว้ในเครื่อง โดยไม่ต้องสมัครสมาชิก</p>
            <div className="hero-actions"><Link className="primary-cta" href="/calculator">เริ่มคำนวณ</Link><Link className="secondary-link" href="/journal">ดูสมุดรายการ →</Link></div>
          </div>
          <aside className="hero-note"><span>LOCAL FIRST</span><strong>ข้อมูลแผนอยู่ใน browser ของคุณ</strong><p>ใช้งาน manual ได้เมื่อแหล่งราคาไม่พร้อม และสำรองข้อมูลออกเป็น JSON หรือ CSV ได้</p></aside>
        </section>
        <section className="tool-picker" aria-labelledby="tool-picker-title">
          <div className="tool-picker-heading"><p className="eyebrow">เลือกงานที่ต้องการทำ</p><h2 id="tool-picker-title">แต่ละงานมีพื้นที่ของตัวเอง</h2><p>เริ่มจากแผนก่อนซื้อ หรือเปิดสมุดเมื่อมีรายการจริงแล้ว</p></div>
          <div className="tool-grid">{tools.map((tool) => <Link className="tool-card" href={tool.href} key={tool.href}><span className="tool-number">{tool.number}</span><h3>{tool.title}</h3><p>{tool.description}</p><strong>{tool.action} <i aria-hidden="true">→</i></strong></Link>)}</div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
