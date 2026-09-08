# Implemented requirements — Local 02

The calculator plans long spot trades in USD or explicitly selected USDT, with net THB cash flows. It runs without accounts or a database. This document describes the current implementation; the task log tracks verification status.

## Calculator

- Planning lives at `/calculator`; actual transaction tracking lives at `/journal`. The root page links to each task without rendering both large workspaces together.
- BTC, ETH, XAU spot and a custom asset label; USD/USDT are separate currencies. XAU uses USD per troy ounce and displays quantity in ounces or grams.
- Capital includes buy fees and an optional fixed THB conversion charge. Buy/sell fees use a percentage or fixed quote-currency amount.
- Independent buy/sell FX rates, always editable. Reference USD/THB is optional and never substitutes for USDT/THB.
- Net THB proceeds, net THB P/L, quote-currency trading P/L, two ROI bases, two break-even prices, attribution and price scenarios.
- Reverse calculation from THB profit/loss targets, including zero and explicit unreachable results.
- Risk sizing from stop price, risk budget and capital cap, including fees. The result assumes execution at the specified stop and FX.
- Coinbase BTC/ETH reference prices and optional server-configured GoldAPI XAU reference. Applying a quote requires a click.
- FX and market references show source, fetch time, provider reference/market time when supplied, and stale state. Missing provider timestamps are not invented.

## Local data

- Latest draft in `tracal.calculator.v2`; v1 is retained. Historical live FX missing from v1 is not reconstructed. Legacy manual FX is marked unverified.
- Up to 100 saved plans, with explicit save/update/duplicate/open/delete, calculation versions, decimal-string outputs and applied FX/market metadata.
- JSON backup/import, preview, validation, 1 MiB limit, new IDs on import collisions, and no partial writes for rejected input.
- Journal with up to 1,000 trades, weighted-average cost separately in quote currency/THB, partial exits, oversell validation, realized and optional marked unrealized P/L.
- Journal groups are asset/quote pairs. Enter FX per trade. Marked unrealized P/L excludes hypothetical future exit costs.
- TRACAL CSV backup/restore and a strictly defined Binance Spot column profile with preview. Third-currency fees are rejected. Imported FX is an explicit user assumption.
- Plan comparison uses the selected asset journal; the user must ensure the journal matches the chosen plan. A remaining position is not presented as a closed-plan outcome.

## Embedding

`/widget` generates a branded iframe for `/embed`. The embed validates brand/color parameters, has no saved-plan/journal access, and uses transient calculator state. No `postMessage` channel is needed.

## Not implemented in this scope

Cloud sync, accounts, subscriptions, AI services, order execution, tax accounting, leverage, historical quote fetching, gold CFD/Thai retail gold models and automatic conversion of BNB/base-asset fees. User research has a prepared kit but no invented participants or revenue.

See [calculation contract](calculation-contract-v2.md), [release notes](release-notes.md), and [tasks](tasks.md).
