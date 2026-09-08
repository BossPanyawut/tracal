"use client";
/* eslint-disable react-hooks/set-state-in-effect -- Read this deployment's origin after hydration. */
import { useEffect, useState } from "react";
import Link from "next/link";
import { widgetQuery } from "@/lib/validation/widget";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
export default function WidgetBuilder() {
  const [brand, setBrand] = useState("TRACAL"), [accent, setAccent] = useState("fcd535"), [origin, setOrigin] = useState("");
  const [preview, setPreview] = useState("/embed"), [notice, setNotice] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  let src = "";
  try { src = `${origin}/embed?${widgetQuery(brand, accent)}`; } catch { /* Invalid builder input is shown below. */ }
  const code = src && origin ? `<iframe src="${src.replaceAll("&", "&amp;")}" title="Trading calculator" width="100%" height="1800" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin" style="border:0;border-radius:12px"></iframe>` : "";
  return <div className="site-shell app-page"><SiteHeader active="widget" /><main className="workspace-width widget-builder"><Link className="secondary-link" href="/">← กลับหน้าแรก</Link><p className="eyebrow">EMBEDDABLE CALCULATOR</p><h1>เครื่องคำนวณสำหรับเว็บไซต์ของคุณ</h1><p>ตั้งชื่อและสี แล้วนำ iframe ไปวางในเว็บไซต์ เครื่องคำนวณทำงานแยกจากหน้าเว็บแม่และไม่อ่านแผนที่บันทึกในเครื่อง</p><div className="workspace-panel"><div className="field-pair"><label className="text-field">ชื่อแบรนด์<input aria-label="ชื่อแบรนด์" maxLength={60} value={brand} onChange={(e) => setBrand(e.target.value)} /></label><label className="text-field">สีหลัก<input aria-label="สีหลัก" type="color" value={`#${accent}`} onChange={(e) => setAccent(e.target.value.slice(1))} /></label></div><button type="button" className="quiet-button" disabled={!src} onClick={() => setPreview(`/embed?${widgetQuery(brand, accent)}`)}>ดูตัวอย่าง</button><label className="text-field">โค้ดสำหรับฝัง<textarea aria-label="โค้ด iframe" readOnly value={code} /></label><button type="button" className="quiet-button" disabled={!code} onClick={async () => { try { await navigator.clipboard.writeText(code); setNotice("คัดลอกแล้ว"); } catch { setNotice("เลือกและคัดลอกโค้ดจากช่องด้านบนได้"); } }}>คัดลอกโค้ด</button>{notice && <p role="status">{notice}</p>}<p className="help-text">ปรับ height ให้เหมาะกับพื้นที่บนเว็บไซต์ ขณะทดสอบในเครื่อง URL จะเป็น localhost; หลัง deploy ให้สร้างโค้ดจากโดเมนจริง</p></div><h2>ตัวอย่าง</h2><iframe className="widget-preview" title="ตัวอย่างเครื่องคำนวณ" src={preview} sandbox="allow-scripts allow-same-origin" /></main><SiteFooter /></div>;
}
