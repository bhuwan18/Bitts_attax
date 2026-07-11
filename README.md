# Bitts Attax

A mobile-first Progressive Web App for browsing a Match Attax card database, tracking your
collection ("Haves") and wishlist ("Wants"), listing cards for trade, negotiating over real-time
chat, and scoring proposed trades with an automated fairness calculator.

See also: [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md), [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md),
[API_SPECIFICATION.md](./API_SPECIFICATION.md), [UI_COMPONENT_MANIFEST.md](./UI_COMPONENT_MANIFEST.md),
[DATA_INGESTION_STRATEGY.md](./DATA_INGESTION_STRATEGY.md), [PWA_STRATEGY.md](./PWA_STRATEGY.md).

## Tech stack

- **Frontend**: Next.js 16 (App Router, TypeScript), Tailwind CSS v4, Shadcn/UI (Base UI primitives)
- **PWA**: [Serwist](https://serwist.pages.dev/) (`@serwist/next`) — see [PWA_STRATEGY.md](./PWA_STRATEGY.md) for why this replaced `next-pwa`
- **Backend**: Next.js Server Actions
- **Database / Auth / Realtime**: Supabase (Postgres, Supabase Auth, Supabase Realtime)
- **Data ingestion**: Cheerio / Puppeteer + Zod, run as a standalone script (never inside the Next.js app)
- **State management**: TanStack Query
- **Deployment target**: Vercel

## Prerequisites

- Node.js 20.9+ and npm
- A [Supabase](https://supabase.com) account (free tier is enough for development)
- Optionally, the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) for generating types and running migrations from your machine

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. In **Project Settings > API**, copy the **Project URL**, **anon public key**, and **service_role key**.
3. Copy `.env.example` to `.env.local` and fill in those three values:

```bash
cp .env.example .env.local
```

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-only, never commit, never expose to the client
```

### 3. Run the database migrations

The schema lives in `supabase/migrations/` (see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for the
full table-by-table breakdown). Apply them with the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Or paste each file's contents into the Supabase Dashboard's SQL Editor, in order:
`0001_init_schema.sql` → `0002_rls_policies.sql` → `0003_fairness_config_seed.sql` → `0004_realtime_publication.sql`.

### 4. Regenerate database types (optional but recommended)

`lib/types/database.types.ts` is hand-authored to match the migrations. Once your project is live,
regenerate the authoritative version:

```bash
npx supabase gen types typescript --project-id your-project-ref > lib/types/database.types.ts
```

### 5. Seed the card database

```bash
npm run seed -- --source=csv --file=./scripts/data/sample-cards.csv
npm run seed -- --source=json --file=./scripts/data/sample-cards.json
```

See [DATA_INGESTION_STRATEGY.md](./DATA_INGESTION_STRATEGY.md) for the adapter architecture and how
to point it at a real data source later.

### 6. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`, sign up for an account, and you should see the seeded card catalog
at `/cards`.

> **Note:** `dev` and `build` both pass `--webpack` explicitly. Serwist's build plugin doesn't yet
> support Turbopack (Next 16's new default) — see [PWA_STRATEGY.md](./PWA_STRATEGY.md).

## Environment variables

| Variable | Where it's used | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Public, safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Public, RLS-restricted |
| `SUPABASE_SERVICE_ROLE_KEY` | `scripts/seed.ts` only | Server-only, bypasses RLS — never commit, never expose to the client |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Serwist disabled in development) |
| `npm run build` | Production build (also bundles the service worker via Serwist) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Run the Vitest unit tests (`lib/fairness.test.ts`) |
| `npm run seed -- --source=<id> [--file=path] [--url=url]` | Run the data ingestion pipeline (`--source=list` to see available adapters) |

## PWA

Install the app from your mobile browser ("Add to Home Screen") to test standalone mode and
offline card browsing. Full details in [PWA_STRATEGY.md](./PWA_STRATEGY.md).

## Project structure

```
app/                  Next.js App Router routes ((auth) and (main) route groups)
components/           React components (ui/ = generated Shadcn primitives)
lib/                   Shared code: Supabase clients, fairness engine, Zod schemas, TanStack Query hooks
scripts/               Standalone data-ingestion pipeline (never imported by the Next.js app)
supabase/migrations/   SQL schema, RLS policies, seed data, realtime publication
```
