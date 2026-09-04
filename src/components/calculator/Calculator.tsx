"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateTrade } from "@/lib/calculation/calculateTrade";
import { requiredSellPrice } from "@/lib/calculation/requiredSellPrice";
import { buildSensitivity } from "@/lib/calculation/sensitivity";
import type { FxQuote } from "@/lib/providers/types";
import { FeeInputs } from "./FeeInputs";
import { ProfitSummary } from "./ProfitSummary";
import { TargetProfit } from "./TargetProfit";
import { TradeInputs } from "./TradeInputs";
import { loadState, saveState } from "./storage";
import type { CalculatorState, FxState } from "./types";

const initialState: CalculatorState = {
  capitalThb: "",
  buyPriceUsd: "",
  sellPriceUsd: "",
  buyFee: { mode: "percent", value: "0.100" },
  sellFee: { mode: "percent", value: "0.100" },
  manualUsdThb: "",
  targetProfitThb: "",
};

export function Calculator() {
  const [state, setState] = useState(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [fx, setFx] = useState<FxState>({ quote: null, loading: true, error: false });

  // localStorage only exists in the browser, so the restore has to happen after
  // mount: reading it during render would make the first client paint disagree
  // with the prerendered HTML and break hydration on the controlled inputs.
  useEffect(() => {
    const stored = loadState();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    if (stored) setState(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/fx?base=USD&quote=THB", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        return (await response.json()) as FxQuote;
      })
      .then((quote) => setFx({ quote, loading: false, error: false }))
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        setFx({ quote: null, loading: false, error: true });
      });
    return () => controller.abort();
  }, []);

  const activeRate = fx.quote ? fx.quote.rate.toString() : state.manualUsdThb;

  const tradeInput = useMemo(() => ({
    capitalThb: state.capitalThb,
    buyPriceUsd: state.buyPriceUsd,
    sellPriceUsd: state.sellPriceUsd,
    buyFee: state.buyFee,
    sellFee: state.sellFee,
    usdThb: activeRate,
  }), [state, activeRate]);

  const { result, calculationError } = useMemo(() => {
    if (!state.capitalThb || !state.buyPriceUsd || !state.sellPriceUsd || !activeRate) {
      return { result: null, calculationError: null };
    }
    try {
      return { result: calculateTrade(tradeInput), calculationError: null };
    } catch (error) {
      return { result: null, calculationError: error instanceof Error ? error.message : "ข้อมูลไม่ถูกต้อง" };
    }
  }, [state, activeRate, tradeInput]);

  const sensitivity = useMemo(
    () => (result ? buildSensitivity(tradeInput) : []),
    [result, tradeInput],
  );

  const target = useMemo(() => {
    if (!state.capitalThb || !state.buyPriceUsd || !state.targetProfitThb || !activeRate) {
      return { price: null, error: null };
    }
    try {
      return {
        price: requiredSellPrice({
          capitalThb: state.capitalThb,
          buyPriceUsd: state.buyPriceUsd,
          buyFee: state.buyFee,
          sellFee: state.sellFee,
          usdThb: activeRate,
          targetProfitThb: state.targetProfitThb,
        }),
        error: null,
      };
    } catch (error) {
      return { price: null, error: error instanceof Error ? error.message : "ข้อมูลไม่ถูกต้อง" };
    }
  }, [state, activeRate]);

  const update = useCallback(<K extends keyof CalculatorState>(key: K, value: CalculatorState[K]) => {
    setState((current) => ({ ...current, [key]: value }));
  }, []);

  function reset() {
    setState(initialState);
  }

  return (
    <section className="calculator-frame" aria-label="Trading calculator">
      <div className="calculator-toolbar">
        <h2>คำนวณกำไร–ขาดทุน</h2>
        <button type="button" onClick={reset}>ล้างค่า</button>
      </div>
      <div className="calculator-grid">
        <div className="inputs-column">
          <TradeInputs state={state} fx={fx} activeRate={activeRate} onChange={update} />
          <FeeInputs buyFee={state.buyFee} sellFee={state.sellFee} onChange={update} />
          <TargetProfit
            targetProfitThb={state.targetProfitThb}
            requiredPrice={target.price}
            error={target.error}
            onChange={update}
          />
        </div>
        <ProfitSummary result={result} error={calculationError} sensitivity={sensitivity} />
      </div>
    </section>
  );
}
