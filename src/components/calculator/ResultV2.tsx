import { D, goldQuantity, type TradeInput, type TradeResult, sensitivity } from "@/lib/calculation/v2";
import { money, formatDecimal } from "@/lib/calculation/format";
export function ResultV2({ result, input, asset, goldUnit, currency }: { currency: string; result: TradeResult | null; input: TradeInput | null; asset: string; goldUnit: "oz" | "g" }) {
  if (!result) return <section className="summary empty"><h2>รอข้อมูลสำหรับคำนวณ</h2><p>กรอกเงินทุน ราคาซื้อ ราคาขาย และเรตทั้งสองขา</p></section>;
  const status = new D(result.profitThb).isZero() ? "neutral" : new D(result.profitThb).gt(0) ? "profit" : "loss";
  let rows: ReturnType<typeof sensitivity> = [];
  if (input) { try { rows = sensitivity(input); } catch { /* Summary can display a historical snapshot. */ } }
  return <section className={`summary ${status}`} aria-label="ผลคำนวณ">
    <div className="profit-main"><small>{status === "profit" ? "กำไร" : status === "loss" ? "ขาดทุน" : "เท่าทุน"}สุทธิ THB</small><strong data-testid="profit-thb">{money(result.profitThb, "THB", true)}</strong><span data-testid="profit-usd">{money(result.tradeProfit, currency, true)}</span><small>กำไรจากการซื้อขาย {currency} ก่อนค่าใช้จ่ายแปลงเงิน THB</small></div>
    <div className="roi-block"><small>ผลตอบแทน THB</small><strong data-testid="roi">{formatDecimal(result.roiThbPercent, 2, true)}%</strong><p className="help-text">ผลตอบแทน {currency} {formatDecimal(result.roiQuotePercent, 2, true)}%</p></div>
    <dl className="metrics">
      <div><dt>จำนวนที่ได้</dt><dd data-testid="quantity">{formatDecimal(asset === "XAU" ? goldQuantity(result.quantity, goldUnit) : result.quantity, 8)}<span>{asset === "XAU" ? goldUnit === "g" ? "กรัม" : "troy ounce" : asset}</span></dd></div>
      <div><dt>เงินออกทั้งหมด</dt><dd>{money(result.totalCostThb, "THB")}</dd></div>
      <div><dt>เงินกลับสุทธิ</dt><dd data-testid="net-sell-thb">{money(result.netSellThb, "THB")}<span>{money(result.netSell, currency)} ก่อนค่าแปลงเงิน</span></dd></div>
      <div><dt>ราคาคุ้มทุน THB</dt><dd>{money(result.breakEvenThb, currency)}<span>ราคาต่อหน่วยที่ได้เงิน THB กลับเท่าทุน</span></dd></div>
      <div><dt>ราคาคุ้มทุน {currency}</dt><dd>{money(result.breakEvenQuote, currency)}</dd></div>
    </dl>
    <div className="attribution"><h3>กำไรมาจากไหน</h3><dl className="metrics"><div><dt>ผลจากราคาสินทรัพย์</dt><dd>{money(result.priceEffectThb, "THB", true)}</dd></div><div><dt>ผลจากค่าเงิน</dt><dd>{money(result.fxEffectThb, "THB", true)}</dd></div><div><dt>หักค่าธรรมเนียมและค่าแปลงเงิน</dt><dd>{money(result.feesThb, "THB")}</dd></div></dl><details><summary>วิธีแยกผลกำไร</summary><p className="help-text">วัดผลราคาด้วยเรตซื้อ และผลค่าเงินบนยอดขายก่อนหักค่าธรรมเนียม แปลงค่าธรรมเนียมแต่ละขาด้วยเรตของขานั้น ผลราคา + ผลค่าเงิน − ค่าใช้จ่าย = กำไรสุทธิบาท</p></details></div>
    {rows.length > 0 && <div className="sensitivity" data-testid="sensitivity"><h3>ถ้าราคาขายเปลี่ยน</h3><table><thead><tr><th scope="col">เปลี่ยน</th><th scope="col">ราคาขาย {currency}</th><th scope="col">กำไร THB</th></tr></thead><tbody>{rows.map((r) => <tr key={r.step} className={r.step === 0 ? "current" : ""}><th scope="row">{r.step > 0 ? "+" : ""}{r.step}%</th><td>{money(r.sellPrice, currency)}</td><td className={new D(r.profitThb).gte(0) ? "up" : "down"}>{money(r.profitThb, "THB", true)}</td></tr>)}</tbody></table></div>}
    <p className="help-text">ประมาณการก่อนภาษีตามข้อมูลที่กรอก ราคาที่ขายหรือแลกเงินจริงอาจต่างออกไป</p>
  </section>;
}
