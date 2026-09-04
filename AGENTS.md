# Trading Calculator Project Instructions

## Goal
Build a reliable trading cost/profit calculator for Crypto and Gold. Base market prices are USD. Results display USD and THB.

## Stack
- Next.js App Router, TypeScript, Tailwind CSS
- Zod and decimal.js
- Vitest and Playwright

## Core rules
- Do not hardcode USD/THB or market prices.
- Never expose provider API keys to client-side code.
- Calculation logic lives in `src/lib/calculation`.
- Normalize external API responses before returning them to the UI.
- Every live market value includes its source and timestamp.
- Manual price and manual FX must continue to work when providers fail.
- Do not add a database or authentication in the MVP.

## Safety and quality
- Never log API keys or commit `.env` files.
- Validate route parameters and provider responses.
- Add timeouts to external requests and fail gracefully.
- Before completion run lint, typecheck, unit/integration tests, E2E tests, build, and review the diff.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
