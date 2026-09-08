# Architecture — Local 02

## Client boundaries

- `/` is a lightweight workspace picker. `/calculator` owns planning and saved plans; `/journal` owns actual transaction records. A client-only compatibility redirect maps the previous root hashes to these routes.
- Shared `SiteHeader`, `SiteFooter` and `WorkspaceIntro` components keep navigation, active-page state and short task guidance consistent without sharing calculator/journal state.
- `Calculator` owns one FX reference state and separate applied buy/sell rate snapshots. `FxTicker` is presentational. New blank sessions may copy the first quote; restored or edited inputs are never overwritten by reference refresh.
- `src/lib/calculation/v2.ts` is the application calculation engine, using an isolated Decimal clone with precision 80. UI/persistence use decimal strings; rounding is for display or conservative risk sizing.
- `src/lib/calculation/journal.ts` computes weighted-average inventory and realized/unrealized results. Validation/schema and CSV parsing live under `src/lib/journal`.
- `src/lib/plans` validates versioned drafts, saved snapshots and backup files. Browser storage writes occur only after validation; readers never silently overwrite corrupt data.
- The original numeric v1 calculation modules remain for regression compatibility; the application uses v2. They are not a second live calculation path.
- `/embed` passes validated brand/color configuration to an ephemeral calculator, which does not read/write saved drafts or plans. The parent page receives no financial values.

## Server/provider boundaries

- `/api/fx?base=USD&quote=THB`: Coinbase exchange rate → Frankfurter/BOT daily reference → process-local last-known-good → structured 503 with manual allowed.
- `/api/market?symbol=BTC|ETH|XAU`: allowlisted Coinbase USD spot prices or GoldAPI XAU/USD. Each asset has a separate last-known-good entry.
- The GoldAPI key is read only in the server provider; no key is sent to the browser or returned in errors.
- Every upstream request has a 5-second timeout and one retry. Zod validates external payloads and internal responses. FX provider adapters return a normalized `FxQuote`; spot adapters return `MarketQuote`.
- Cached fetch defaults: Coinbase FX/spot 60 seconds; BOT FX 3,600 seconds; GoldAPI 300 seconds. `FX_CACHE_SECONDS` can override FX defaults.
- In-memory rate limits cap per-key requests and map growth. They and last-known-good memory are best-effort per process, not globally coordinated limits/caches.
- Provider fetch time is observation/retrieval time, not a guarantee of tick freshness. Coinbase does not expose market time on the chosen price endpoints; its market/reference time is null.

## Versions and compatibility

- Draft/backup schema version: 2. Calculation version: 2.0. Journal schema version: 1.
- Historical snapshot outputs stay available for different calculation versions until the user asks to recalculate. New schema versions are rejected until a migration exists.
- Quote-neutral fields `buyPrice`, `sellPrice`, `buyFx`, `sellFx`, `tradeProfit` have an explicit `quoteCurrency`. USD and USDT values are never implicitly exchanged.
- XAU quantities are stored/calculated in troy ounces; grams are a display conversion, not a different market instrument.

## External API references checked during implementation

- [Coinbase spot price API](https://docs.cdp.coinbase.com/coinbase-app/track-apis/prices): `/v2/prices/:currency_pair/spot`.
- [GoldAPI official example](https://github.com/goldapi-io/gold-api-examples-js): `/api/XAU/USD`, server `x-access-token`, price and timestamp response fields.

These adapters support the documented response shapes. Production data licensing and provider availability depend on the deployed service/account; they are not inferred from passing mocked tests.
