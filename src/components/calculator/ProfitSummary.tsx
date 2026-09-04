import type { TradeCalculationResult } from "@/lib/calculation/types";

type Props = { result: TradeCalculationResult | null; error: string | null };

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const thb = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 2, maximumFractionDigits: 2 });

function signed(formatter: Intl.NumberFormat, value: number) {
  return `${value > 0 ? "+" : ""}${formatter.format(value)}`;
}

export function ProfitSummary({ result, error }: Props) {
  if (!result) {
    return (
      <section className="summary empty" aria-live="polite">
        <p className="eyebrow"><span /> RESULT</p>
        <h2>รอข้อมูลสำหรับคำนวณ</h2>
        <p>{error || "กรอกจำนวน ราคาซื้อ ราคาขาย และอัตรา USD/THB"}</p>
      </section>
    );
  }
  const status = result.profitUsd > 0 ? "profit" : result.profitUsd < 0 ? "loss" : "neutral";
  return (
    <section className={`summary ${status}`} aria-live="polite">
      <div className="summary-topline">
        <p className="eyebrow"><span /> RESULT</p>
        <span className="result-word">{status === "profit" ? "กำไร" : status === "loss" ? "ขาดทุน" : "เท่าทุน"}</span>
      </div>
      <div className="profit-main">
        <small>PROFIT / LOSS</small>
        <strong data-testid="profit-usd">{signed(usd, result.profitUsd)}</strong>
        <span data-testid="profit-thb">{signed(thb, result.profitThb)}</span>
      </div>
      <div className="roi-block">
        <small>RETURN ON INVESTMENT</small>
        <strong data-testid="roi">{result.roiPercent > 0 ? "+" : ""}{result.roiPercent.toFixed(2)}%</strong>
      </div>
      <dl className="metrics">
        <div><dt>ต้นทุนรวม</dt><dd>{usd.format(result.totalCostUsd)}<span>{thb.format(result.totalCostThb)}</span></dd></div>
        <div><dt>ยอดขายสุทธิ</dt><dd>{usd.format(result.netSellUsd)}<span>{thb.format(result.netSellThb)}</span></dd></div>
        <div><dt>ค่าธรรมเนียมรวม</dt><dd>{usd.format(result.buyFeeUsd + result.sellFeeUsd)}</dd></div>
        <div><dt>ราคาขายคุ้มทุน</dt><dd>{usd.format(result.breakEvenSellPriceUsd)}<span>ต่อหน่วยราคา</span></dd></div>
      </dl>
    </section>
  );
}
