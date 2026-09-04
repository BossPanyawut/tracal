"use client";

import { useCallback, useEffect, useState } from "react";
import type { FxQuote } from "@/lib/providers/types";

const rateFormat = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const timeFormat = new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" });

type State = { quote: FxQuote | null; loading: boolean; error: boolean };

export function FxTicker() {
  const [state, setState] = useState<State>({ quote: null, loading: true, error: false });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/fx?base=USD&quote=THB", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        return (await response.json()) as FxQuote;
      })
      .then((quote) => setState({ quote, loading: false, error: false }))
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        setState({ quote: null, loading: false, error: true });
      });
    return () => controller.abort();
  }, [reload]);

  const retry = useCallback(() => {
    setState({ quote: null, loading: true, error: false });
    setReload((value) => value + 1);
  }, []);

  return (
    <aside className="fx-card" aria-label="อัตราแลกเปลี่ยน USD/THB" aria-live="polite">
      <p className="fx-card-title">อัตราแลกเปลี่ยน</p>
      <div className="fx-pair">
        <span className="unit-chip"><i aria-hidden="true">$</i>USD</span>
        <span className="fx-arrow" aria-hidden="true">→</span>
        <span className="unit-chip"><i aria-hidden="true" className="baht">฿</i>THB</span>
      </div>
      {state.quote ? (
        <>
          <p className="fx-rate">{rateFormat.format(state.quote.rate)}</p>
          <p className="fx-meta">
            1 ดอลลาร์สหรัฐ · อัปเดต {timeFormat.format(new Date(state.quote.fetchedAt))} น.
            {state.quote.stale ? " (ข้อมูลย้อนหลัง)" : ""}
          </p>
        </>
      ) : state.error ? (
        <>
          <p className="fx-rate muted">—</p>
          <p className="fx-meta">
            ดึงอัตราแลกเปลี่ยนไม่สำเร็จ{" "}
            <button type="button" onClick={retry}>ลองอีกครั้ง</button>
          </p>
        </>
      ) : (
        <>
          <p className="fx-rate muted">—</p>
          <p className="fx-meta">กำลังโหลด</p>
        </>
      )}
    </aside>
  );
}
