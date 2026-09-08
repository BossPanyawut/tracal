# TRACAL

A local-first trading planner for USD/USDT spot trades and USD gold spot, with net THB cash flows. Enter prices, independent buy/sell FX and fees; see quote-currency and THB profit, ROI, break-even prices, attribution and scenario results.

## Features

- Reverse THB profit targets and risk sizing from stop price, risk budget and capital cap.
- Manual FX always available; optional USD/THB reference with source/time and fallback.
- BTC/ETH reference prices; optional GoldAPI XAU reference. Gold quantity display in troy ounces or grams.
- Saved plans with frozen applied rates, calculation versions and JSON backup/import.
- Multiple-entry/partial-exit journal, weighted-average costs, per-trade FX and CSV backup/import.
- Separate USD/USDT modes; no implicit USD=USDT assumption.
- `/widget` creates branded iframe code; `/embed` runs a transient calculator.
- `/` is a focused tool picker; `/calculator` and `/journal` keep planning and actual records in separate workspaces. Legacy `/#calculator` and `/#journal` links redirect to the new pages.
- No database, login or exchange account connection. Records stay in browser storage.

## Run

```bash
npm install
npm run dev
```

Open `/calculator` to create plans, `/journal` to record actual trades, or choose a workspace from `/`.

`FX_CACHE_SECONDS` optionally configures FX caching. `GOLD_API_KEY` is an optional server-only credential for gold reference prices. Manual gold calculations need no key. Do not commit local environment files.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Run E2E and build sequentially. Automated provider tests use mocks; they do not prove live provider uptime.

## Documentation

- [Development plan and checkpoints](docs/development-plan.md)
- [Task backlog and execution log](docs/tasks.md)
- [Calculation contract v2](docs/calculation-contract-v2.md)
- [AI agent execution runbook](docs/agent-runbook.md)
- [Requirements](docs/requirements.md), [architecture](docs/architecture.md), [testing](docs/testing-strategy.md), [deployment](docs/deployment.md)
- [Release notes, data migration and CSV limitations](docs/release-notes.md)
- [Pilot kit](docs/product-validation.md) and [future cloud/member work](docs/future-cloud.md)

These are estimates under the prices, FX and execution assumptions entered, before tax. Saved plans are local to the browser/origin; export backups before moving devices or clearing site data.
