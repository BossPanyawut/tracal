import type { CalculatorState } from "./types";

type Props = {
  state: CalculatorState;
  onChange: (key: "quantity" | "buyPriceUsd" | "sellPriceUsd", value: string) => void;
};

export function TradeInputs({ state, onChange }: Props) {
  const quantityUnit = state.assetType === "gold"
    ? state.goldUnit === "gram" ? "GRAM" : "OZ"
    : state.assetId === "bitcoin" ? "BTC" : "ETH";
  return (
    <section className="input-section" aria-labelledby="prices-heading">
      <div className="section-heading">
        <span>02</span><h2 id="prices-heading">Position &amp; prices</h2>
      </div>
      <label className="field-label">
        <span>จำนวน <b>{quantityUnit}</b></span>
        <div className="number-field">
          <input
            aria-label="Quantity"
            inputMode="decimal"
            placeholder="0.00"
            value={state.quantity}
            onChange={(event) => onChange("quantity", event.target.value)}
          />
          <em>{quantityUnit}</em>
        </div>
      </label>
      <div className="field-pair">
        <label className="field-label">
          <span>ราคาซื้อ <b>USD</b></span>
          <div className="number-field prefix">
            <em>$</em>
            <input aria-label="Buy price USD" inputMode="decimal" placeholder="0.00" value={state.buyPriceUsd} onChange={(event) => onChange("buyPriceUsd", event.target.value)} />
          </div>
        </label>
        <label className="field-label">
          <span>ราคาขาย <b>USD</b></span>
          <div className="number-field prefix">
            <em>$</em>
            <input aria-label="Sell price USD" inputMode="decimal" placeholder="0.00" value={state.sellPriceUsd} onChange={(event) => onChange("sellPriceUsd", event.target.value)} />
          </div>
        </label>
      </div>
    </section>
  );
}
