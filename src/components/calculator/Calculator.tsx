"use client";
/* eslint-disable react-hooks/set-state-in-effect -- Restore browser draft before fetching reference quotes. */
import { useEffect, useMemo, useRef, useState } from "react";
import { calculate, CALCULATION_VERSION, D, signedNumericText, sizeRisk, targetPrice, type TradeInput, type TradeResult } from "@/lib/calculation/v2";
import { formatDecimal, money } from "@/lib/calculation/format";
import { draftSchema, newDraft, toTradeInput, type Draft, type FxMeta, type Plan } from "@/lib/plans/schema";
import { loadDraft, saveDraft } from "@/lib/plans/storage";
import { fxQuoteSchema, type FxQuote } from "@/lib/providers/types";
import { FxOrigin } from "@/components/fx/FxOrigin";
import { FxTicker } from "@/components/fx/FxTicker";
import { PlanManager } from "@/components/plans/PlanManager";
import { MarketPrice } from "@/components/market/MarketPrice";
import { ResultV2 } from "./ResultV2";
import { NumberField } from "./Fields";

export function Calculator({ embedded = false }: { embedded?: boolean }) {
  const [draft, setDraft] = useState<Draft>(newDraft), [hydrated, setHydrated] = useState(false);
  const [storageEnabled, setStorageEnabled] = useState(false), [storageNotice, setStorageNotice] = useState("");
  const [quote, setQuote] = useState<FxQuote | null>(null), [loading, setLoading] = useState(true), [fxError, setFxError] = useState(false), [reload, setReload] = useState(0);
  const [snapshot, setSnapshot] = useState<Plan | null>(null);
  const [resetVersion, setResetVersion] = useState(0);
  const autoFill = useRef(false);
  const freeze = snapshot !== null && snapshot.calculationVersion !== CALCULATION_VERSION;
  useEffect(() => {
    if (embedded) { setHydrated(true); autoFill.current = true; return; }
    try { const loaded = loadDraft(localStorage); setDraft(loaded.draft); autoFill.current = !loaded.restored; setStorageEnabled(true); if (loaded.warning) setStorageNotice(loaded.warning); }
    catch { setStorageNotice("อ่าน draft เดิมไม่ได้ เก็บข้อมูลเดิมไว้และหยุดบันทึกอัตโนมัติ คุณยังคำนวณและบันทึกเป็นแผนได้"); }
    setHydrated(true);
  }, [embedded]);
  useEffect(() => {
    if (!hydrated || !storageEnabled || !draftSchema.safeParse(draft).success) return;
    try { saveDraft(localStorage, draft); }
    catch { setStorageEnabled(false); setStorageNotice("บันทึก draft ไม่ได้ พื้นที่อาจเต็มหรือ browser ปิด storage กรุณาสำรองแผน"); }
  }, [draft, hydrated, storageEnabled]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setFxError(false);
    fetch("/api/fx?base=USD&quote=THB", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("unavailable");
      const value = fxQuoteSchema.parse(await response.json());
      setQuote(value); setLoading(false);
      if (autoFill.current) {
        autoFill.current = false;
        setDraft((current) => current.quoteCurrency === "USD" && !current.buyFx && !current.sellFx ? { ...current, buyFx: String(value.rate), sellFx: String(value.rate), buyFxMeta: metadata(value), sellFxMeta: metadata(value) } : current);
      }
    }).catch((error: Error) => { if (error.name !== "AbortError") { setFxError(true); setLoading(false); } });
    return () => controller.abort();
  }, [reload]);
  function metadata(value: FxQuote): FxMeta { return { kind: "reference", source: value.source, referenceDate: value.referenceDate ?? undefined, fetchedAt: value.fetchedAt, stale: value.stale }; }
  function edit<K extends keyof Draft>(key: K, value: Draft[K]) {
    setSnapshot(null);
    if (key === "buyFx" || key === "sellFx" || key === "quoteCurrency") autoFill.current = false;
    setDraft((current) => ({ ...current, [key]: value, ...(key === "buyFx" ? { buyFxMeta: { kind: "manual" as const } } : {}), ...(key === "sellFx" ? { sellFxMeta: { kind: "manual" as const } } : {}), ...(key === "sellPrice" ? { sellPriceMeta: undefined } : {}) }));
  }
  function applyReference(side: "buy" | "sell" | "both") {
    if (!quote || draft.quoteCurrency !== "USD") return;
    autoFill.current = false; setSnapshot(null);
    setDraft((current) => ({ ...current, migrationNotice: undefined,
      ...(side !== "sell" ? { buyFx: String(quote.rate), buyFxMeta: metadata(quote) } : {}),
      ...(side !== "buy" ? { sellFx: String(quote.rate), sellFxMeta: metadata(quote) } : {}) }));
  }
  function reset() { autoFill.current = false; setSnapshot(null); setDraft(newDraft()); setResetVersion((value) => value + 1); }
  function currency(value: "USD" | "USDT") {
    autoFill.current = false; setSnapshot(null);
    setDraft((current) => ({ ...current, quoteCurrency: value, asset: current.asset === "XAU" && value !== "USD" ? "BTC" : current.asset, buyPrice: "", sellPrice: "", buyFx: "", sellFx: "", buyFxMeta: { kind: "manual" }, sellFxMeta: { kind: "manual" }, sellPriceMeta: undefined }));
  }
  const { input, result, error } = useMemo((): { input: TradeInput | null; result: TradeResult | null; error: string | null } => {
    if (freeze) return { input: null, result: snapshot.result as TradeResult, error: null };
    if (![draft.capitalThb, draft.buyPrice, draft.sellPrice, draft.buyFx, draft.sellFx, draft.buyFee.value, draft.sellFee.value].every(Boolean)) return { input: null, result: null, error: null };
    try { const input = toTradeInput(draft); return { input, result: calculate(input), error: null }; }
    catch (e) { return { input: null, result: null, error: e instanceof Error && !e.message.startsWith("[") ? e.message : "ตรวจตัวเลข: ใช้ไม่เกิน 18 หลักและทศนิยม 12 ตำแหน่ง" }; }
  }, [draft, freeze, snapshot]);
  const target = useMemo(() => {
    if (!draft.targetProfitThb || !draft.buyPrice || !draft.capitalThb || !draft.buyFx || !draft.sellFx) return null;
    try { return targetPrice(toTradeInput({ ...draft, sellPrice: draft.sellPrice || "0" }), draft.targetProfitThb); }
    catch { return { price: null, error: "ตรวจข้อมูลเงินทุน ราคา เรต และกำไรเป้าหมาย" }; }
  }, [draft]);
  const risk = useMemo(() => {
    if (!draft.stopPrice || !draft.riskBudgetThb || !draft.maxCapitalThb || !draft.buyPrice || !draft.buyFx || !draft.sellFx) return null;
    try { return { result: sizeRisk(toTradeInput({ ...draft, capitalThb: draft.capitalThb || "1", sellPrice: draft.sellPrice || "0" }), draft.stopPrice, draft.riskBudgetThb, draft.maxCapitalThb), error: null }; }
    catch (e) { return { result: null, error: e instanceof Error && !e.message.startsWith("[") ? e.message : "ตรวจข้อมูลแผนขาดทุน" }; }
  }, [draft]);
  function open(plan: Plan) { autoFill.current = false; setDraft(plan.input); setSnapshot(plan); }
  const unit = draft.quoteCurrency;
  return <div className={embedded ? "embedded-calculator" : ""}>
    <FxTicker quote={quote} loading={loading} error={fxError} onRefresh={() => setReload((n) => n + 1)} />
    {storageNotice && <p className="notice" role="status">{storageNotice}</p>}
    {draft.migrationNotice && <p className="notice">{draft.migrationNotice}</p>}
    {freeze && <div className="notice"><p>แสดงผลที่บันทึกด้วยสูตรรุ่น {snapshot.calculationVersion} กดคำนวณใหม่ก่อนแก้ไขแผน</p><button type="button" className="quiet-button" onClick={() => setSnapshot(null)}>คำนวณใหม่ด้วยสูตรปัจจุบัน</button></div>}
    <section className="calculator-frame" aria-label="Trading calculator">
      <div className="calculator-toolbar"><h2>คำนวณกำไร–ขาดทุนสุทธิ</h2><button type="button" onClick={reset}>ล้างค่า</button></div>
      <div className="calculator-grid"><fieldset className="inputs-column calculator-fields" disabled={freeze}>
        <section className="input-section"><h3 className="section-title">สินทรัพย์และเงินทุน</h3>
          <div className="field-pair"><label className="text-field">สินทรัพย์<select aria-label="สินทรัพย์" value={draft.asset} onChange={(e) => { const asset = e.target.value as Draft["asset"]; autoFill.current = false; setSnapshot(null); setDraft((d) => ({ ...d, asset, quoteCurrency: asset === "XAU" ? "USD" : d.quoteCurrency, buyPrice: "", sellPrice: "", sellPriceMeta: undefined, ...(asset === "XAU" && d.quoteCurrency === "USDT" ? { buyFx: "", sellFx: "", buyFxMeta: { kind: "manual" }, sellFxMeta: { kind: "manual" } } : {}) })); }}><option value="BTC">Bitcoin · BTC</option><option value="ETH">Ethereum · ETH</option><option value="XAU">Gold spot · XAU</option><option value="CUSTOM">กำหนดเอง</option></select></label>
          <label className="text-field">สกุลราคาซื้อขาย<select aria-label="สกุลราคาซื้อขาย" value={unit} onChange={(e) => currency(e.target.value as "USD" | "USDT")} disabled={draft.asset === "XAU"}><option>USD</option><option>USDT</option></select></label></div>
          {draft.asset === "CUSTOM" && <label className="text-field">ชื่อสินทรัพย์<input maxLength={80} value={draft.assetLabel} onChange={(e) => edit("assetLabel", e.target.value)} /></label>}
          {draft.asset === "XAU" && <><p className="help-text">Gold spot: ราคาฐาน USD ต่อ troy ounce · ไม่ใช่ราคาทองไทยหรือ CFD</p><label className="text-field">แสดงจำนวนทองเป็น<select aria-label="หน่วยทอง" value={draft.goldUnit} onChange={(e) => edit("goldUnit", e.target.value as "oz" | "g")}><option value="oz">Troy ounce</option><option value="g">กรัม</option></select></label></>}
          <NumberField label="เงินทุนที่ใช้ซื้อ รวมค่าใช้จ่าย" ariaLabel="Capital THB" unit="THB" value={draft.capitalThb} onChange={(v) => edit("capitalThb", v)} />
          <NumberField label={draft.asset === "XAU" ? "ราคาซื้อต่อ troy ounce" : "ราคาซื้อต่อหน่วย"} ariaLabel={`Buy price ${unit}`} unit={unit} value={draft.buyPrice} onChange={(v) => edit("buyPrice", v)} />
          <NumberField label={draft.asset === "XAU" ? "ราคาขายต่อ troy ounce" : "ราคาขายต่อหน่วย"} ariaLabel={`Sell price ${unit}`} unit={unit} value={draft.sellPrice} onChange={(v) => edit("sellPrice", v)} />
          <MarketPrice asset={draft.asset} currency={unit} onApply={(price, meta) => { setSnapshot(null); setDraft((d) => ({ ...d, sellPrice: price, sellPriceMeta: meta })); }} />
          {draft.sellPriceMeta && <p className="help-text">ราคาขายจาก {draft.sellPriceMeta.source} · ดึง {new Date(draft.sellPriceMeta.fetchedAt).toLocaleString("th-TH")}{draft.sellPriceMeta.stale ? " · ข้อมูลเก่า" : ""}</p>}
        </section>
        <section className="input-section"><h3 className="section-title">เรตขาซื้อและขาขาย</h3><p className="help-text">กรอกเรตที่ใช้จริง หรือกดใช้ราคาอ้างอิงข้างล่าง</p>
          <div className="field-pair"><NumberField label="เรตซื้อ (THB ต่อหน่วยเงิน)" ariaLabel="Buy FX rate" value={draft.buyFx} onChange={(v) => edit("buyFx", v)} unit={`THB/${unit}`} /><NumberField label="เรตขาย (THB ต่อหน่วยเงิน)" ariaLabel="Sell FX rate" value={draft.sellFx} onChange={(v) => edit("sellFx", v)} unit={`THB/${unit}`} /></div>
          <FxOrigin label="ขาซื้อ" meta={draft.buyFxMeta} /><FxOrigin label="ขาขาย" meta={draft.sellFxMeta} />
          {unit === "USD" ? <div className="action-row">{(["buy", "sell", "both"] as const).map((side) => <button type="button" className="quiet-button" key={side} disabled={!quote} onClick={() => applyReference(side)}>ใช้อ้างอิง{side === "buy" ? "ขาซื้อ" : side === "sell" ? "ขาขาย" : "ทั้งสองขา"}</button>)}</div> : <p className="notice">USDT ใช้เรตแลก USDT/THB ที่คุณกรอกเอง ไม่ใช้ USD/THB แทน</p>}
          {draft.buyFx && draft.buyFx === draft.sellFx && <p className="help-text">แปลงที่เรตเดียวกันทั้งสองขา เป็นสมมติฐานค่าเงินคงที่</p>}
        </section>
        <section className="input-section"><h3 className="section-title">ค่าธรรมเนียมและค่าแปลงเงิน</h3><div className="field-pair">{(["buyFee", "sellFee"] as const).map((key) => <div key={key}><label className="text-field">ประเภทค่าธรรมเนียม{key === "buyFee" ? "ซื้อ" : "ขาย"}<select aria-label={`Fee mode ${key}`} value={draft[key].mode} onChange={(e) => edit(key, { ...draft[key], mode: e.target.value as "fixed" | "percent" })}><option value="percent">เปอร์เซ็นต์</option><option value="fixed">คงที่ {unit}</option></select></label><NumberField label={key === "buyFee" ? "ค่าธรรมเนียมซื้อ" : "ค่าธรรมเนียมขาย"} value={draft[key].value} unit={draft[key].mode === "percent" ? "%" : unit} onChange={(v) => edit(key, { ...draft[key], value: v })} /></div>)}</div>
          <div className="field-pair"><NumberField label="ค่าแปลงเงินขาเข้าเพิ่มเติม" value={draft.buyConversionCostThb} unit="THB" onChange={(v) => edit("buyConversionCostThb", v)} /><NumberField label="ค่าแปลงเงินขาออกเพิ่มเติม" value={draft.sellConversionCostThb} unit="THB" onChange={(v) => edit("sellConversionCostThb", v)} /></div><p className="help-text">ค่าเริ่มต้นเป็นเพียงตัวอย่างค่าธรรมเนียม กรุณาตรวจอัตราของคุณ หากเรตรวม spread แล้วไม่ต้องบวกซ้ำ</p>
        </section>
        <section className="input-section"><h3 className="section-title">เป้าหมายกำไรสุทธิ</h3><NumberField label="อยากได้กำไรเท่าไร" ariaLabel="Target profit THB" unit="THB" value={draft.targetProfitThb} onChange={(v) => edit("targetProfitThb", v)} />{target?.price !== null && target?.price !== undefined && <p className="target-answer" data-testid="required-price">ต้องขายที่ <strong>{money(target.price, unit)}</strong> · ราคาเต็ม {formatDecimal(target.price, 8)} {unit} ต่อหน่วย</p>}{target?.error && <p className="notice">{target.error}</p>}</section>
        {!embedded && <section className="input-section"><h3 className="section-title">วางแผนขาดทุน</h3><NumberField label="ราคาตัดขาดทุนตามแผน" ariaLabel="Stop price" unit={unit} value={draft.stopPrice} onChange={(v) => edit("stopPrice", v)} /><div className="field-pair"><NumberField label="รับขาดทุนตามแผนได้" ariaLabel="Risk budget THB" unit="THB" value={draft.riskBudgetThb} onChange={(v) => edit("riskBudgetThb", v)} /><NumberField label="เงินทุนสูงสุด" ariaLabel="Max capital THB" unit="THB" value={draft.maxCapitalThb} onChange={(v) => edit("maxCapitalThb", v)} /></div>{risk?.error && <p className="notice">{risk.error}</p>}{risk?.result && <div className="risk-answer" data-testid="risk-result"><p>จำนวนซื้อ {formatDecimal(risk.result.quantity, 8)} · เงินทุน {money(risk.result.capitalThb, "THB")}<br />ขาดทุนตามราคา Stop {money(risk.result.expectedLossThb, "THB")}</p>{signedNumericText.safeParse(draft.targetProfitThb).success && new D(risk.result.expectedLossThb).gt(0) && <p>กำไรเป้าหมาย/ขาดทุนตามแผน: {formatDecimal(new D(draft.targetProfitThb).div(risk.result.expectedLossThb).toFixed(), 2)} เท่า</p>}<button type="button" className="quiet-button" onClick={() => edit("capitalThb", risk.result!.capitalThb)}>ใช้เงินทุนจากแผนขาดทุน</button></div>}<p className="help-text">คำนวณกรณีขายได้ที่ Stop และเรตที่ระบุ การขายจริงอาจคลาดเคลื่อนและขาดทุนมากกว่านี้</p></section>}
      </fieldset><div>{error && <p className="notice" role="alert">{error}</p>}<ResultV2 currency={unit} result={result} input={input} asset={draft.asset === "CUSTOM" ? draft.assetLabel || "หน่วย" : draft.asset} goldUnit={draft.goldUnit} /></div></div>
    </section>
    {!embedded && hydrated && <PlanManager draft={draft} onOpen={open} onNew={reset} canSave={result !== null && !freeze} resetVersion={resetVersion} />}
  </div>;
}
