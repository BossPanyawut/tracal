# Testing strategy

- Unit tests cover acceptance arithmetic, loss, fixed/percentage fees, break-even, decimal edges, invalid input, and gold conversion.
- Integration tests mock upstream HTTP at the provider boundary, validate normalization and secret header placement, exercise last-known-good behavior, and assert internal route contracts.
- Component tests cover real-time calculation, explicit adoption of market price, and automatic manual-FX fallback.
- Playwright covers crypto and gold happy paths plus manual FX on desktop and mobile Chromium profiles.

Quality gates are `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, and `npm run build`.
