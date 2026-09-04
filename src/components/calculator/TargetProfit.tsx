type Props = {
  targetProfitThb: string;
  requiredPrice: number | null;
  error: string | null;
  onChange: (key: "targetProfitThb", value: string) => void;
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 });

export function TargetProfit({ targetProfitThb, requiredPrice, error, onChange }: Props) {
  return (
    <section className="input-section" aria-labelledby="target-heading">
      <h2 id="target-heading" className="section-title">เป้าหมายกำไร</h2>
      <label className="field-block">
        <span className="field-block-label">อยากได้กำไรเท่าไร</span>
        <div className="field-block-row">
          <input
            aria-label="Target profit THB"
            inputMode="decimal"
            placeholder="0.00"
            value={targetProfitThb}
            onChange={(event) => onChange("targetProfitThb", event.target.value)}
          />
          <span className="unit-chip"><i aria-hidden="true" className="baht">฿</i>THB</span>
        </div>
      </label>
      {requiredPrice !== null ? (
        <p className="target-answer" data-testid="required-price">
          ต้องขายที่ <strong>{usd.format(requiredPrice)}</strong> ต่อหน่วย
        </p>
      ) : error ? (
        <p className="rate-note warn">{error}</p>
      ) : (
        <p className="rate-note">กรอกเงินทุนและราคาซื้อก่อน แล้วใส่กำไรที่ต้องการ</p>
      )}
    </section>
  );
}
