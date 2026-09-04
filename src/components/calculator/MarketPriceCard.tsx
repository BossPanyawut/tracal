import type { MarketState } from "./types";

type Props = { market: MarketState; onUsePrice: () => void; onRetry: () => void };

function timeLabel(value?: string | null) {
  if (!value) return "timestamp unavailable";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function MarketPriceCard({ market, onUsePrice, onRetry }: Props) {
  return (
    <section className="data-card" aria-labelledby="market-heading">
      <div className="data-card-head">
        <div><span className="live-dot" /><h3 id="market-heading">Reference market</h3></div>
        {market.quote?.stale && <span className="stale-badge">LAST KNOWN</span>}
      </div>
      <div className="rate-value">
        {market.loading && !market.quote ? "Loading…" : market.quote ? `$${market.quote.price.toLocaleString("en-US", { maximumFractionDigits: 6 })}` : "Manual only"}
      </div>
      <p className="data-meta">
        {market.quote ? `${market.quote.symbol} · ${market.quote.source} · ${timeLabel(market.quote.marketUpdatedAt || market.quote.fetchedAt)}` : market.error || "Live reference price"}
      </p>
      <div className="market-actions">
        <button type="button" className="use-price" onClick={onUsePrice} disabled={!market.quote}>Use as sell price <span>↗</span></button>
        {market.error && <button type="button" className="retry" onClick={onRetry}>Retry</button>}
      </div>
    </section>
  );
}
