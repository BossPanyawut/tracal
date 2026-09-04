import type { SensitivityRow } from "@/lib/calculation/sensitivity";
import type { TradeCalculationResult } from "@/lib/calculation/types";
import { SensitivityTable } from "./SensitivityTable";

type Props = {
  result: TradeCalculationResult | null;
  error: string | null;
  sensitivity: SensitivityRow[];
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const thb = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const units = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 });

function signed(formatter: Intl.NumberFormat, value: number) {
  return `${value > 0 ? "+" : ""}${formatter.format(value)}`;
}

export function ProfitSummary({ result, error, sensitivity }: Props) {
  if (!result) {
    return (
      <section className="summary empty" aria-live="polite">
        <h2>รอข้อมูลสำหรับคำนวณ</h2>
        <p>{error || "กรอกเงินทุน ราคาซื้อ และราคาขาย"}</p>
      </section>
    );
  }
  const status = result.profitUsd > 0 ? "profit" : result.profitUsd < 0 ? "loss" : "neutral";
  return (
    <section className={`summary ${status}`} aria-live="polite">
      <div className="profit-main">
        <small>{status === "profit" ? "กำไร" : status === "loss" ? "ขาดทุน" : "เท่าทุน"}</small>
        <strong data-testid="profit-thb">{signed(thb, result.profitThb)}</strong>
        <span data-testid="profit-usd">{signed(usd, result.profitUsd)}</span>
      </div>
      <div className="roi-block">
        <small>ผลตอบแทน</small>
        <strong data-testid="roi">{result.roiPercent > 0 ? "+" : ""}{result.roiPercent.toFixed(2)}%</strong>
      </div>
      <dl className="metrics">
        <div><dt>จำนวนที่ได้</dt><dd data-testid="quantity">{units.format(result.quantity)}<span>หน่วย</span></dd></div>
        <div><dt>ต้นทุนรวม</dt><dd>{usd.format(result.totalCostUsd)}<span>{thb.format(result.totalCostThb)}</span></dd></div>
        <div><dt>ยอดขายสุทธิ</dt><dd>{usd.format(result.netSellUsd)}</dd></div>
        <div><dt>ค่าธรรมเนียมรวม</dt><dd>{usd.format(result.buyFeeUsd + result.sellFeeUsd)}</dd></div>
        <div><dt>ราคาขายคุ้มทุน</dt><dd>{usd.format(result.breakEvenSellPriceUsd)}<span>ต่อหน่วย</span></dd></div>
      </dl>
      <SensitivityTable rows={sensitivity} />
    </section>
  );
}
