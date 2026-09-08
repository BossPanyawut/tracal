import type { Metadata } from "next";
import { Calculator } from "@/components/calculator/Calculator";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { WorkspaceIntro } from "@/components/layout/WorkspaceIntro";

export const metadata: Metadata = { title: "คำนวณและบันทึกแผน — TRACAL" };

export default function CalculatorPage() {
  return <div className="site-shell app-page">
    <SiteHeader active="calculator" />
    <main>
      <WorkspaceIntro eyebrow="PLAN BEFORE YOU TRADE" title="คำนวณและบันทึกแผน" description="ดูเงินออก เงินกลับ กำไรสุทธิเป็นบาท และผลของค่าเงินในที่เดียว แล้วบันทึกสมมติฐานไว้เปิดดูภายหลัง" steps={["เลือกสินทรัพย์และใส่เงินทุน", "กรอกราคา เรต และค่าใช้จ่าย", "ตรวจผลลัพธ์แล้วบันทึกแผน"]} companion={{ href: "/journal", label: "สมุดรายการ", detail: "บันทึกสิ่งที่ซื้อขายจริงและดูต้นทุนเฉลี่ย" }} />
      <div className="calculator-shell"><Calculator /></div>
    </main>
    <SiteFooter />
  </div>;
}
