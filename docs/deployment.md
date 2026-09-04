# Deployment

## Environment

Copy `.env.example` to a non-committed environment file. `GOLD_API_KEY` is required only for a live gold quote; the rest of the calculator continues in manual mode when it is absent. CoinGecko can be used without a key at its public limits.

## Vercel

Import the repository, configure environment variables, and deploy with the standard Next.js build command. Provider fetch revalidation uses the platform data cache; last-known-good process memory is best-effort.

## Docker

Build with `docker build -t tracal .` and run with `docker run --env-file .env.local -p 3000:3000 tracal`. The container runs the Next.js standalone server as an unprivileged user.
