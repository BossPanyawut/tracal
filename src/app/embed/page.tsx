import type { CSSProperties } from "react";
import { Calculator } from "@/components/calculator/Calculator";
import { widgetSchema } from "@/lib/validation/widget";
export const metadata = { title: "TRACAL calculator widget", robots: { index: false, follow: false } };
export default async function EmbedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const parsed = widgetSchema.safeParse(await searchParams);
  if (!parsed.success) return <main className="embedded-calculator"><h1>ตั้งค่า widget ไม่ถูกต้อง</h1><p>ใช้ brand ไม่เกิน 60 ตัวอักษร และ accent เป็นรหัสสี 6 หลัก</p></main>;
  const { brand, accent } = parsed.data;
  return <main style={{ "--primary": `#${accent}` } as CSSProperties}><header className="embedded-calculator"><h1>{brand}</h1><p className="help-text">วางแผนกำไรสุทธิเป็นบาท · Powered by TRACAL</p></header><Calculator embedded /></main>;
}
