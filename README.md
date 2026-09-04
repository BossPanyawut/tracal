# TRACAL

Trading cost and profit calculator for crypto and gold (XAU/USD), with USD and THB results. Live quotes are reference data only; calculation remains available with manual price and FX when a provider is unavailable.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

`GOLD_API_KEY` enables the live gold quote. CoinGecko and Coinbase USD/THB use their public endpoints, with BOT/Frankfurter as the daily FX fallback. An optional CoinGecko demo key can be configured.

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

See [`docs/requirements.md`](docs/requirements.md), [`docs/architecture.md`](docs/architecture.md), [`docs/testing-strategy.md`](docs/testing-strategy.md), and [`docs/deployment.md`](docs/deployment.md) for the project decisions and operating notes.
