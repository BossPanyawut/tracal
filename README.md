# TRACAL

Trading profit and loss calculator. Enter your capital in THB plus the per-unit buy and sell prices in USD, and it works out the quantity your capital buys, then the profit/loss, ROI and break-even sell price — fees included.

It also:

- shows profit at a ladder of sell prices (±5%, ±10%) so the downside sits next to the upside
- answers the reverse question: what sell price reaches a target profit
- remembers your inputs in the browser between visits

The home page shows a reference USD/THB rate, served by `/api/fx`, which is also the rate used to convert your capital.

## Run locally

```bash
npm install
npm run dev
```

No configuration is required. `FX_CACHE_SECONDS` (see `.env.example`) optionally tunes how long the USD/THB rate is cached; both rate sources are public endpoints and need no API key.

## USD/THB rate sources

| Order | Source | Endpoint |
| --- | --- | --- |
| Primary | Coinbase | `api.coinbase.com/v2/exchange-rates?currency=USD` |
| Fallback | Bank of Thailand via Frankfurter | `api.frankfurter.dev/v2/rate/USD/THB?providers=BOT` |

If both fail, the last successful rate is served and flagged as stale.

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

See [`docs/requirements.md`](docs/requirements.md), [`docs/architecture.md`](docs/architecture.md), [`docs/testing-strategy.md`](docs/testing-strategy.md), and [`docs/deployment.md`](docs/deployment.md) for the project decisions and operating notes.
