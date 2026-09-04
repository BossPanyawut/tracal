"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateTrade } from "@/lib/calculation/calculateTrade";
import { toTroyOunces } from "@/lib/calculation/goldUnits";
import type { FxQuote, GoldMarketQuote, MarketQuote } from "@/lib/providers/types";
import { AssetSelector } from "./AssetSelector";
import { FeeInputs } from "./FeeInputs";
import { FxRateCard } from "./FxRateCard";
import { MarketPriceCard } from "./MarketPriceCard";
import { ProfitSummary } from "./ProfitSummary";
import { TradeInputs } from "./TradeInputs";
import type { CalculatorState, FxState, MarketState } from "./types";

const initialState: CalculatorState = {
  assetType: "crypto",
  assetId: "bitcoin",
  quantity: "",
  buyPriceUsd: "",
  sellPriceUsd: "",
  buyFee: { mode: "percent", value: "0.100" },
  sellFee: { mode: "percent", value: "0.100" },
  fxMode: "live",
  manualUsdThb: "",
  goldUnit: "oz",
};

async function readApi<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message || "Unable to load live data.");
  return body as T;
}

export function Calculator() {
  const [state, setState] = useState(initialState);
  const [fx, setFx] = useState<FxState>({ quote: null, loading: true, error: null });
  const [market, setMarket] = useState<MarketState>({ quote: null, loading: true, error: null });
  const [fxReload, setFxReload] = useState(0);
  const [marketReload, setMarketReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    readApi<FxQuote>("/api/fx?base=USD&quote=THB", controller.signal)
      .then((quote) => setFx({ quote, loading: false, error: null }))
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        setFx((current) => ({ ...current, loading: false, error: error.message }));
        setState((current) => ({ ...current, fxMode: "manual" }));
      });
    return () => controller.abort();
  }, [fxReload]);

  useEffect(() => {
    const controller = new AbortController();
    const url = state.assetType === "gold"
      ? "/api/market?type=gold"
      : `/api/market?type=crypto&id=${state.assetId}`;
    readApi<MarketQuote | GoldMarketQuote>(url, controller.signal)
      .then((quote) => setMarket({ quote, loading: false, error: null }))
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        setMarket({ quote: null, loading: false, error: error.message });
      });
    return () => controller.abort();
  }, [state.assetType, state.assetId, marketReload]);

  const activeFx = state.fxMode === "live" ? fx.quote?.rate.toString() || "" : state.manualUsdThb;
  const { result, calculationError } = useMemo(() => {
    if (!state.quantity || !state.buyPriceUsd || !state.sellPriceUsd || !activeFx) {
      return { result: null, calculationError: null };
    }
    try {
      const quantity = state.assetType === "gold"
        ? toTroyOunces(state.quantity, state.goldUnit)
        : state.quantity;
      return {
        result: calculateTrade({
          quantity,
          buyPriceUsd: state.buyPriceUsd,
          sellPriceUsd: state.sellPriceUsd,
          buyFee: state.buyFee,
          sellFee: state.sellFee,
          usdThb: activeFx,
        }),
        calculationError: null,
      };
    } catch (error) {
      return { result: null, calculationError: error instanceof Error ? error.message : "Invalid input." };
    }
  }, [state, activeFx]);

  const update = useCallback(<K extends keyof CalculatorState>(key: K, value: CalculatorState[K]) => {
    if (key === "assetType" || key === "assetId") {
      setMarket({ quote: null, loading: true, error: null });
    }
    setState((current) => ({ ...current, [key]: value }));
  }, []);

  function reset() {
    setState({ ...initialState, fxMode: fx.quote ? "live" : "manual" });
  }

  return (
    <section className="calculator-frame" aria-label="Trading calculator">
      <div className="calculator-toolbar">
        <div><span className="status-dot" /> REAL-TIME CALCULATION</div>
        <button type="button" onClick={reset}>↻ Reset calculator</button>
      </div>
      <div className="calculator-grid">
        <div className="inputs-column">
          <AssetSelector assetType={state.assetType} assetId={state.assetId} goldUnit={state.goldUnit} onChange={update} />
          <TradeInputs state={state} onChange={update} />
          <FeeInputs buyFee={state.buyFee} sellFee={state.sellFee} onChange={update} />
          <div className="live-data-grid">
            <MarketPriceCard market={market} onUsePrice={() => market.quote && update("sellPriceUsd", market.quote.price.toString())} onRetry={() => {
              setMarket((current) => ({ ...current, loading: true, error: null }));
              setMarketReload((value) => value + 1);
            }} />
            <FxRateCard state={state} fx={fx} onModeChange={(mode) => update("fxMode", mode)} onManualChange={(value) => update("manualUsdThb", value)} onRetry={() => {
              setFx((current) => ({ ...current, loading: true, error: null }));
              setFxReload((value) => value + 1);
            }} />
          </div>
        </div>
        <ProfitSummary result={result} error={calculationError} />
      </div>
    </section>
  );
}
