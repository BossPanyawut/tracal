import type { Metadata } from "next";
import { Journal } from "@/components/journal/Journal";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { WorkspaceIntro } from "@/components/layout/WorkspaceIntro";

export const metadata: Metadata = { title: "สมุดรายการซื้อขาย — TRACAL" };

export default function JournalPage() {
  return <div className="site-shell app-page journal-page">
    <SiteHeader active="journal" />
    <main>
      <WorkspaceIntro eyebrow="TRACK WHAT HAPPENED" title="สมุดรายการซื้อขาย" description="รวมการซื้อหลายไม้และการขายบางส่วน คำนวณต้นทุนเฉลี่ย กำไรที่ขายแล้ว และมูลค่าส่วนที่ยังถือจากข้อมูลในเครื่องนี้" steps={["เพิ่มหรือนำเข้ารายการจริง", "เลือกสมุดสินทรัพย์ที่ต้องการดู", "ตรวจผลและสำรองเป็น CSV"]} companion={{ href: "/calculator", label: "คำนวณแผนใหม่", detail: "ทดลองราคาและความเสี่ยงก่อนบันทึกรายการจริง" }} />
      <div className="journal-shell"><Journal /></div>
    </main>
    <SiteFooter />
  </div>;
}
