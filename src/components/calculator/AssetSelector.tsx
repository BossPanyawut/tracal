import { CRYPTO_ASSETS } from "@/lib/providers/types";
import type { CalculatorState } from "./types";

type Props = {
  assetType: CalculatorState["assetType"];
  assetId: CalculatorState["assetId"];
  goldUnit: CalculatorState["goldUnit"];
  onChange: <K extends "assetType" | "assetId" | "goldUnit">(
    key: K,
    value: CalculatorState[K],
  ) => void;
};

export function AssetSelector({ assetType, assetId, goldUnit, onChange }: Props) {
  return (
    <section className="input-section" aria-labelledby="asset-heading">
      <div className="section-heading">
        <span>01</span><h2 id="asset-heading">Asset</h2>
      </div>
      <div className="segmented" aria-label="Asset type">
        <button
          type="button"
          className={assetType === "crypto" ? "active" : ""}
          aria-pressed={assetType === "crypto"}
          onClick={() => onChange("assetType", "crypto")}
        >Crypto</button>
        <button
          type="button"
          className={assetType === "gold" ? "active" : ""}
          aria-pressed={assetType === "gold"}
          onClick={() => onChange("assetType", "gold")}
        >Gold</button>
      </div>

      {assetType === "crypto" ? (
        <label className="field-label">
          <span>สินทรัพย์</span>
          <select value={assetId} onChange={(event) => onChange("assetId", event.target.value as CalculatorState["assetId"])}>
            {Object.entries(CRYPTO_ASSETS).map(([id, asset]) => (
              <option key={id} value={id}>{asset.symbol} — {asset.name}</option>
            ))}
          </select>
        </label>
      ) : (
        <div>
          <p className="mini-label">หน่วยปริมาณทองคำ</p>
          <div className="segmented small" aria-label="Gold quantity unit">
            <button type="button" className={goldUnit === "oz" ? "active" : ""} aria-pressed={goldUnit === "oz"} onClick={() => onChange("goldUnit", "oz")}>Troy ounce</button>
            <button type="button" className={goldUnit === "gram" ? "active" : ""} aria-pressed={goldUnit === "gram"} onClick={() => onChange("goldUnit", "gram")}>Gram</button>
          </div>
          <p className="unit-note">ราคา XAU/USD อ้างอิงต่อ 1 troy ounce</p>
        </div>
      )}
    </section>
  );
}
