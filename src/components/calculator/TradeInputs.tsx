import type { CalculatorState, FxState } from "./types";

type Props = {
  state: CalculatorState;
  fx: FxState;
  activeRate: string;
  onChange: (key: "capitalThb" | "buyPriceUsd" | "sellPriceUsd" | "manualUsdThb", value: string) => void;
};

const rateFormat = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

export function TradeInputs({ state, fx, activeRate, onChange }: Props) {
  return (
    <section className="input-section" aria-labelledby="prices-heading">
      <h2 id="prices-heading" className="sr-only">เงินทุนและราคา</h2>
      <label className="field-block">
        <span className="field-block-label">เงินทุนที่ใช้ซื้อ</span>
        <div className="field-block-row">
          <input
            aria-label="Capital THB"
            inputMode="decimal"
            placeholder="0.00"
            value={state.capitalThb}
            onChange={(event) => onChange("capitalThb", event.target.value)}
          />
          <span className="unit-chip"><i aria-hidden="true" className="baht">฿</i>THB</span>
        </div>
      </label>
      {fx.quote ? (
        <p className="rate-note">
          แปลงที่ {rateFormat.format(fx.quote.rate)} บาทต่อดอลลาร์
          {fx.quote.stale ? " (ข้อมูลย้อนหลัง)" : ""}
        </p>
      ) : fx.loading ? (
        <p className="rate-note">กำลังโหลดอัตราแลกเปลี่ยน</p>
      ) : (
        <label className="field-block manual-rate">
          <span className="field-block-label">อัตรา USD/THB (กรอกเอง)</span>
          <div className="field-block-row">
            <input
              aria-label="Manual USD THB rate"
              inputMode="decimal"
              placeholder="0.0000"
              value={state.manualUsdThb}
              onChange={(event) => onChange("manualUsdThb", event.target.value)}
            />
            <span className="unit-chip plain">บาท/ดอลลาร์</span>
          </div>
        </label>
      )}
      <label className="field-block">
        <span className="field-block-label">ราคาซื้อต่อหน่วย</span>
        <div className="field-block-row">
          <input
            aria-label="Buy price USD"
            inputMode="decimal"
            placeholder="0.00"
            value={state.buyPriceUsd}
            onChange={(event) => onChange("buyPriceUsd", event.target.value)}
          />
          <span className="unit-chip"><i aria-hidden="true">$</i>USD</span>
        </div>
      </label>
      <label className="field-block">
        <span className="field-block-label">ราคาขายต่อหน่วย</span>
        <div className="field-block-row">
          <input
            aria-label="Sell price USD"
            inputMode="decimal"
            placeholder="0.00"
            value={state.sellPriceUsd}
            onChange={(event) => onChange("sellPriceUsd", event.target.value)}
          />
          <span className="unit-chip"><i aria-hidden="true">$</i>USD</span>
        </div>
      </label>
      {!activeRate && !fx.loading ? (
        <p className="rate-note warn">กรอกอัตรา USD/THB เพื่อเริ่มคำนวณ</p>
      ) : null}
    </section>
  );
}
