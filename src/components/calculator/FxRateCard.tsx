import type { CalculatorState, FxState } from "./types";

type Props = {
  state: CalculatorState;
  fx: FxState;
  onModeChange: (mode: CalculatorState["fxMode"]) => void;
  onManualChange: (value: string) => void;
  onRetry: () => void;
};

function timeLabel(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function FxRateCard({ state, fx, onModeChange, onManualChange, onRetry }: Props) {
  return (
    <section className="data-card" aria-labelledby="fx-heading">
      <div className="data-card-head">
        <div><span className="live-dot" /><h3 id="fx-heading">USD / THB</h3></div>
        {fx.quote?.stale && <span className="stale-badge">LAST KNOWN</span>}
      </div>
      <div className="rate-value">
        {fx.loading && !fx.quote ? "Loading…" : fx.quote ? `฿${fx.quote.rate.toLocaleString("en-US", { maximumFractionDigits: 4 })}` : "Unavailable"}
      </div>
      <p className="data-meta">
        {fx.quote ? `${fx.quote.source} · Rate date ${fx.quote.referenceDate} · Fetched ${timeLabel(fx.quote.fetchedAt)}` : fx.error || "Current reference rate"}
      </p>
      <div className="mode-row">
        <button type="button" className={state.fxMode === "live" ? "active" : ""} onClick={() => onModeChange("live")} disabled={!fx.quote}>Market FX</button>
        <button type="button" className={state.fxMode === "manual" ? "active" : ""} onClick={() => onModeChange("manual")}>Manual FX</button>
        {fx.error && <button type="button" className="retry" onClick={onRetry}>Retry</button>}
      </div>
      {state.fxMode === "manual" && (
        <label className="manual-fx">
          <span>1 USD เท่ากับ</span>
          <div className="number-field">
            <input aria-label="Manual USD THB rate" inputMode="decimal" placeholder="กรอกอัตรา USD/THB" value={state.manualUsdThb} onChange={(event) => onManualChange(event.target.value)} />
            <em>THB</em>
          </div>
        </label>
      )}
    </section>
  );
}
