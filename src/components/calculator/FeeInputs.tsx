import type { FeeMode } from "@/lib/calculation/types";
import type { CalculatorState } from "./types";

type Props = {
  buyFee: CalculatorState["buyFee"];
  sellFee: CalculatorState["sellFee"];
  onChange: (side: "buyFee" | "sellFee", value: CalculatorState["buyFee"]) => void;
};

function FeeControl({ label, fee, onChange }: { label: string; fee: CalculatorState["buyFee"]; onChange: (value: CalculatorState["buyFee"]) => void }) {
  return (
    <div className="field-block fee-control">
      <div className="fee-label-row">
        <label htmlFor={`${label}-value`} className="field-block-label">{label}</label>
        <div className="micro-toggle">
          {(["percent", "fixed"] as FeeMode[]).map((mode) => (
            <button key={mode} type="button" className={fee.mode === mode ? "active" : ""} onClick={() => onChange({ ...fee, mode })} aria-pressed={fee.mode === mode}>
              {mode === "percent" ? "%" : "USD"}
            </button>
          ))}
        </div>
      </div>
      <div className="field-block-row">
        <input id={`${label}-value`} aria-label={label} inputMode="decimal" placeholder="0" value={fee.value} onChange={(event) => onChange({ ...fee, value: event.target.value })} />
        <span className="unit-chip plain">{fee.mode === "percent" ? "%" : "USD"}</span>
      </div>
    </div>
  );
}

export function FeeInputs({ buyFee, sellFee, onChange }: Props) {
  return (
    <section className="input-section fees" aria-labelledby="fees-heading">
      <h2 id="fees-heading" className="section-title">ค่าธรรมเนียม</h2>
      <div className="field-pair">
        <FeeControl label="ค่าธรรมเนียมซื้อ" fee={buyFee} onChange={(value) => onChange("buyFee", value)} />
        <FeeControl label="ค่าธรรมเนียมขาย" fee={sellFee} onChange={(value) => onChange("sellFee", value)} />
      </div>
      <p className="fee-note">ค่าเริ่มต้นคือ Binance Spot สำหรับผู้ใช้ทั่วไป 0.100% ต่อรายการ อัตราจริงอาจต่างตาม VIP, BNB discount หรือโปรโมชัน</p>
    </section>
  );
}
