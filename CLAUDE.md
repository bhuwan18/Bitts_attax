# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## This is NOT the Next.js you know

This project runs Next.js 16, which has breaking changes vs. training-data Next.js — most notably
`middleware.ts` is renamed `proxy.ts` (same location, same purpose, new name/export). Before writing
routing/caching/config code, check the relevant guide in `node_modules/next/dist/docs/` and heed
deprecation notices rather than assuming pre-16 conventions.

Also: `dev`/`build` run with `--webpack` explicitly (not Turbopack, Next 16's new default) because
Serwist's build plugin doesn't yet support Turbopack — don't drop that flag. See
[PWA_STRATEGY.md](./PWA_STRATEGY.md).

## Commands

```bash
npm run dev                    # dev server (service worker disabled)
npm run build                  # production build (bundles the Serwist service worker)
npm run lint                   # ESLint
npm run typecheck              # tsc --noEmit (app/sw.ts is excluded, see PWA_STRATEGY.md)
npm run test                   # vitest run — all tests
npx vitest run lib/fairness.test.ts   # single test file
npx vitest lib/fairness.test.ts       # watch mode for one file
npm run seed -- --source=list  # list registered data-ingestion adapters
npm run seed -- --source=csv --file=./scripts/data/sample-cards.csv
```

There is no separate lint/typecheck/test config to discover — those four npm scripts are the whole
verification surface.

## Architecture

Full detail lives in project docs — read the relevant one before working in that area rather than
re-deriving it from source:

- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) — overall request flow, component map
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — tables, RLS policies, ERD
- [API_SPECIFICATION.md](./API_SPECIFICATION.md) — every Server Action's signature and behavior
- [UI_COMPONENT_MANIFEST.md](./UI_COMPONENT_MANIFEST.md) — component-by-component map
- [DATA_INGESTION_STRATEGY.md](./DATA_INGESTION_STRATEGY.md) — seeder adapter pattern
- [PWA_STRATEGY.md](./PWA_STRATEGY.md) — Serwist setup and caching rules

### The big picture

No separate backend service. Next.js Server Actions running in the Next.js server process are the
**only write path**, and they always go through a session-scoped Supabase client
(`lib/supabase/server.ts`) — so Row Level Security is enforced even if an action has a bug. Server
Actions never trust a client-supplied user id; they always re-derive identity via
`supabase.auth.getUser()`. Reads happen directly from the client (TanStack Query + Supabase browser
client, `lib/queries/*.ts`) or from Server Components at request time — there's no separate "read
API," RLS decides what a query returns.

The one process that runs outside the Next.js app is `scripts/seed.ts` (standalone, run via `tsx`,
never imported by app code): Puppeteer needs a full Chromium binary that can't run in a Vercel
serverless function, and only the seeder should hold `SUPABASE_SERVICE_ROLE_KEY`. Source adapters
(CSV/JSON live, Cheerio/Puppeteer are illustrative templates) all funnel through one Zod
normalize → batched-upsert pipeline (`scripts/ingest/`).

`proxy.ts` (Next 16's renamed `middleware.ts`) refreshes the Supabase session cookie on every
request and redirects unauthenticated visitors away from `(main)` routes. The `(auth)` route group
(login/signup/magic-link) is unauthenticated; `(main)` (cards/inventory/trades/profile) is
authenticated, enforced by `proxy.ts`.

Trade fairness is computed by the pure function `computeFairnessScore` (`lib/fairness.ts`) against a
table-driven `fairness_rules` config (not hardcoded weights), so the heuristic is tunable without a
deploy. `computeAndPersistFairness` (`app/(main)/trades/[tradeId]/fairness-actions.ts`) loads a
trade's items + the active rules row, calls the pure function, and persists the result onto
`trades.fairness_score`/`fairness_breakdown`. It's safe to call repeatedly — each call recomputes
from current state and overwrites the stored result.

Chat uses a channel-per-trade Realtime pattern: `lib/realtime/useTradeChannel.ts` subscribes to
Postgres Changes on `messages` filtered by `trade_id` and pushes new rows straight into the TanStack
Query cache. RLS still governs what a subscribed client actually receives.

The service worker (`app/sw.ts`, Serwist) caches the read-only card catalog (`StaleWhileRevalidate`)
and images (`CacheFirst`) for offline browsing, but `/inventory`, `/trades`, and chat are
`NetworkOnly` — there is deliberately no offline write queue; writes attempted offline simply don't
happen rather than being silently queued.

### Conventions worth knowing before editing

- Every Server Action file groups by domain (`inventory/actions.ts`, `trades/actions.ts`,
  `trades/[tradeId]/fairness-actions.ts`, `trades/[tradeId]/chat/actions.ts`), validates its input
  against a Zod schema in `lib/validation/`, and calls `revalidatePath` on success.
- `cards`, `fairness_rules` writes are service-role-only at the RLS layer — there is intentionally
  no client-side write path for either; don't add Server Actions that write to them with a
  session-scoped client, they'll be rejected by RLS.
- `trade_listings`/`trade_listing_items` (a public advertisement) and `trades`/`trade_items` (a
  concrete negotiation between two specific users) are deliberately separate table pairs so a
  negotiation can diverge from the listing's original terms — don't conflate them.
- Shadcn/UI components (`components/ui/`) are generated via `npx shadcn add`, built on **Base UI**
  (`style: "base-nova"` in `components.json`), not Radix — don't hand-edit them or assume
  Radix-specific APIs/props.
- Before pointing a scraping adapter (`scripts/ingest/adapters/exampleCheerioAdapter.ts` /
  `examplePuppeteerAdapter.ts`) at a real site: check `robots.txt`/ToS, add rate-limit delays, prefer
  an official API/export if one exists, and register a new adapter `id` rather than overwriting the
  example.
