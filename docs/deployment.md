# Deployment — Local 02

## Runtime and optional settings

The app has no database or authentication. Start with `npm install` and `npm run dev`; build with `npm run build` and serve with `npm start`.

- `FX_CACHE_SECONDS`: optional positive integer for FX caching.
- `GOLD_API_KEY`: optional server-only GoldAPI key for XAU/USD reference prices. Without it, manual gold calculations still work and the quote route fails gracefully.

Keep credentials in the deployment environment or an ignored local environment file. Never put them in `NEXT_PUBLIC_*`, a widget URL or committed files. Existing environment files are not modified by this release.

## Hosting

The existing standalone Next.js output and Dockerfile remain supported. Vercel or another Next.js-capable host can serve `/`, `/calculator`, `/journal`, `/widget`, `/embed`, `/api/fx` and `/api/market`.

Before publishing a commercial deployment, verify your provider plan's data/display terms. Rate limits and last-known-good caches are per-process; horizontally scaled instances do not share them. A shared service can be added later if real traffic warrants it.

## Release checklist

- Run all quality gates and review the diff.
- Back up browser plans as JSON and the journal as CSV before migration/rollback trials.
- Verify manual calculation with providers unavailable, then explicitly apply reference FX and prices when available.
- Verify source/time labels and no client-side credentials.
- Open `/widget` on the deployed origin to generate the correct public iframe URL.
- Verify `/`, `/calculator` and `/journal` navigation on desktop and mobile; confirm old `/#calculator` and `/#journal` bookmarks redirect correctly.
- Smoke-test save/reload/import on the exact deployed origin. Browser storage is origin-specific and does not follow users across devices/domains.

## Rollback

Restore the previous application revision without deleting browser storage. v1 remains under its old key; v2 drafts/plans and journal data remain under separate keys. The older app cannot read the new saved plans/journal, so keep backups and restore the newer app to regain access. Never downgrade the stored schema by overwriting it with old-format data.

Deploying and contacting external services beyond normal price fetches are separate operational actions. This development task prepares a local release; it does not publish it.
