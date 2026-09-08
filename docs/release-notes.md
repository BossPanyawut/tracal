# Local 02 — Release notes

## New behavior

- Planning and actual records now have separate `/calculator` and `/journal` pages. The root page is a short workspace picker, and legacy hash links redirect to the matching page.
- Shared navigation remains visible on mobile, marks the current page and provides a direct next-workspace action.
- Independent buy/sell FX with explicit reference adoption and complete source/time labels.
- Net THB cash flows, separate quote-currency return, two break-even prices, attribution, reverse profit targets and risk sizing.
- USD and USDT modes; XAU spot quantities in troy ounces/grams; optional BTC/ETH/gold reference prices.
- Versioned saved plans, duplication and JSON backup/import.
- Local weighted-average journal for multiple entries and partial sales, per-trade FX, CSV backup/import and plan comparison.
- Branded widget builder and transient iframe calculator.

## Data migration

Existing v1 data is retained. Valid legacy manual FX is marked for review because v1 preferred live FX when available. Missing historical live FX stays blank; users choose a reference or enter their actual rate. No current price is represented as a historical fact.

Plan JSON and journal CSV are separate backups. Neither requires an account. Clearing site data can remove local records; export backups when moving browsers or devices.

## CSV support

TRACAL CSV columns: `id,occurredAt,asset,quoteCurrency,side,quantity,price,feeQuote,fx,extraCostThb`. Time is ISO UTC, fee is in the quote currency and extra conversion cost is THB.

The Binance Spot import profile expects `Date(UTC),Pair,Side,Price,Executed,Fee` (extra columns allowed). Dates must be `YYYY-MM-DD HH:mm:ss`; pairs end in USD/USDT. Quantity/price/fee may include their matching asset/currency suffix. Other export layouts need conversion to TRACAL CSV. This is a supported column profile, not a claim that all Binance account/export variants match it.

Binance files do not include THB settlement FX, so the import requires a user-entered batch rate. Split files by actual FX where needed. Fees in BNB/base assets are rejected, not assumed to be zero or converted at a fabricated price. Identical fills within the same file get occurrence IDs; exact re-imports are idempotent. Overlapping partial exports with different occurrence ordering should be reconciled by the user before import.

## Known scope limits

- Gold reference needs a configured server key and provider access. Gold spot is not Thai retail gold or leveraged CFDs.
- Journal estimated unrealized profit excludes future exit fees and does not constitute tax accounting.
- Plan comparison is against the chosen asset/quote journal; isolate relevant trades before interpreting the difference.
- Widget height is configurable in the iframe code; it does not communicate account data to a parent page.
- No cloud sync, subscriptions, AI model calls or automated order execution. Cloud/member work is explicitly deferred by the user's scope decision.
- User pilot and revenue validation remain pending real participants; no research outcomes have been invented.

Quality gate evidence and task status live in [tasks.md](tasks.md).
