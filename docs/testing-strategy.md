# Testing strategy — Local 02

## Automated coverage

- Legacy unit fixtures retain the original single-FX behavior.
- `tests/unit/v2.test.ts`: dual FX fixtures, fee combinations, attribution identity, target round trips, unreachable targets, numeric edges, risk/capital bounds, gold quantity conversion and distinct quote currencies.
- `tests/unit/plans.test.ts`: snapshot export/import, versions, ID collisions, invalid data, quota failures and preservation of legacy storage.
- `tests/unit/journal.test.ts`: weighted-average quote/THB costs, partial/full exits, cash-flow reconciliation, oversell rejection, CSV quoting/formula escaping, duplicate and conflicting IDs, Binance profile validation.
- `tests/integration/fx.test.ts`: normalization, malformed responses, timeout/retry, primary/fallback/stale/no-cache paths, query validation and rate limits.
- `tests/integration/market.test.ts`: asset allowlist, per-symbol cache isolation, manual fallback without a gold key, upstream secret placement and response validation.
- Component tests cover manual FX during failure, reference refresh without overwrite, target/partial input states, migration, currency switching and saved-plan persistence.
- Playwright exercises route separation and legacy hash redirects, calculator, plans/backup/import, risk sizing, market adoption, USD/USDT/gold, journal/CSV and widget on desktop and Pixel 7 profiles.

All automated provider paths are mocked. Passing these tests does not demonstrate live provider uptime or production data permissions.

## Commands

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Run E2E and build sequentially because the E2E server uses `.next`. E2E starts its own server on port 3107 unless `TRACAL_PLAYWRIGHT_BASE_URL` is set. Do not terminate unrelated servers occupying that port.

## Browser review

Inspect desktop and mobile interaction/layout, long financial values, field labels and focus, source/time labels, manual fallback, saved plans and import failures. Record actual results in the task log; automated assertions are not a substitute for visual review.
