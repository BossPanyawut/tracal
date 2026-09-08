"use client";
import { useEffect, useRef, useState } from "react";
import { marketQuoteSchema, type MarketQuote } from "@/lib/providers/marketTypes";
import { money } from "@/lib/calculation/format";
export function MarketPrice({ asset, currency, onApply }: { asset: string; currency: string; onApply: (price: string, meta: { source: string; fetchedAt: string; marketUpdatedAt: string | null; stale: boolean }) => void }) {
  const [quote, setQuote] = useState<MarketQuote | null>(null), [error, setError] = useState(""), [loading, setLoading] = useState(false);
  const current = useRef({ asset, currency });
  useEffect(() => { current.current = { asset, currency }; }, [asset, currency]);
  if (currency !== "USD" || asset === "CUSTOM") return <p className="help-text">กรอกราคาซื้อขายของคุณเอง · {currency === "USDT" ? "ไม่ใช้ราคา USD แทนราคา USDT" : "สินทรัพย์กำหนดเอง"}</p>;
  const visible = quote?.symbol === asset ? quote : null;
  async function refresh() {
    const selected = asset; setLoading(true); setError("");
    try {
      const response = await fetch(`/api/market?symbol=${selected}`, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error();
      const result = marketQuoteSchema.parse(await response.json());
      if (result.symbol !== selected) throw new Error();
      if (current.current.asset === selected && current.current.currency === "USD") setQuote(result);
    } catch { if (current.current.asset === selected) setError(asset === "XAU" ? "ดึงราคาทองไม่ได้ หากยังไม่ได้ตั้งค่า GoldAPI ให้กรอกราคาเอง" : "ดึงราคาอ้างอิงไม่ได้ กรอกราคาเองได้"); }
    finally { setLoading(false); }
  }
  return <div className="market-reference"><button type="button" className="quiet-button" disabled={loading} onClick={refresh}>{loading ? "กำลังดึงราคา…" : "ดูราคาอ้างอิง"}</button>{error && <p className="notice">{error}</p>}{visible && <><p>{money(visible.price, "USD")} / {visible.unit === "troy_ounce" ? "troy ounce" : asset}</p><p className="help-text">{visible.source} · เวลาตลาด {visible.marketUpdatedAt ? new Date(visible.marketUpdatedAt).toLocaleString("th-TH") : "ผู้ให้บริการไม่ระบุ"}<br />ดึง {new Date(visible.fetchedAt).toLocaleString("th-TH")} {visible.stale ? "· ข้อมูลเก่า" : ""}</p><button type="button" className="quiet-button" onClick={() => onApply(visible.price, { source: visible.source, fetchedAt: visible.fetchedAt, marketUpdatedAt: visible.marketUpdatedAt, stale: visible.stale })}>ใช้ราคานี้เป็นราคาขาย</button></>}</div>;
}
