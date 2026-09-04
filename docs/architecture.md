# Architecture

The App Router page renders an interactive client calculator. Pure arithmetic is isolated in `src/lib/calculation` and uses `decimal.js`; numeric input remains a string until this boundary. External calls are only made by server-side provider adapters and normalized before the UI sees them.

## Boundaries

- `/api/fx` calls Coinbase for the current USD/THB rate, then Frankfurter/BOT as a daily-reference fallback.
- `/api/market?type=crypto&id=…` calls CoinGecko for an allowlisted asset.
- `/api/market?type=gold` calls GoldAPI with `GOLD_API_KEY` in a server-only header.
- Services retain a process-local last-known-good quote and mark it stale after provider failure.
- The browser never applies a market quote to the calculator without an explicit user action.

## Cache and failure policy

Market and FX fetches use Next.js revalidation (default 60 seconds). Each provider request times out after five seconds and is retried once. FX falls back from Coinbase to the BOT daily reference before trying last-known-good data. If no quote is available, the API returns a structured 503 with `manualInputAllowed: true`. The calculator remains usable with manual sell price and manual FX.

Process-local last-known-good memory is best-effort on serverless instances. A shared cache can replace it later without changing the provider or UI contracts.

## Security

Asset IDs and currency pairs are allowlisted with Zod, upstream payloads are validated, arbitrary URLs are never accepted, public endpoints have a conservative in-memory request limit, secrets are never logged, and external requests use timeouts. Inputs reject negative/non-finite values and percentage fees at or above 100%.
