# Data Ingestion Strategy

The card catalog is seeded by a standalone script (`scripts/seed.ts`), never by the Next.js app
itself. This is deliberate: Puppeteer needs a full Chromium binary that cannot run inside a Vercel
serverless function, and a seeding tool has no business holding the `SUPABASE_SERVICE_ROLE_KEY`
inside a process that also serves user traffic.

## Architecture

```
scripts/
├── seed.ts                       CLI entrypoint (npm run seed -- --source=... --file=/--url=...)
└── ingest/
    ├── adapter.ts                SourceAdapter interface + registry
    ├── normalize.ts               raw records -> validated NormalizedCard[]
    ├── upsertCards.ts             batched upsert via service-role key
    └── adapters/
        ├── csvAdapter.ts          reads scripts/data/*.csv
        ├── jsonAdapter.ts         reads scripts/data/*.json
        ├── exampleCheerioAdapter.ts    illustrative static-HTML scrape template
        └── examplePuppeteerAdapter.ts  illustrative JS-rendered scrape template
```

### `SourceAdapter` interface (`scripts/ingest/adapter.ts`)

```ts
interface SourceAdapter {
  id: string;
  description: string;
  fetchRaw(options: Record<string, string>): Promise<RawCardRecord[]>;
}
```

Every source — file-based or scraped — implements this interface and registers with the same
registry, so `scripts/seed.ts` doesn't need to know anything source-specific. All adapters funnel
into the same normalize → upsert pipeline.

## Normalization (`scripts/ingest/normalize.ts`, `lib/validation/card.schema.ts`)

Raw records vary wildly in shape depending on source (CSV gives you strings for everything; a
scraped page gives you whatever text nodes happened to be there). Normalization happens in two
Zod passes:

1. **`RawCardRowSchema`** — a loose, coercive schema (`z.coerce.number()` etc., `.passthrough()`
   for unknown columns) that accepts anything vaguely card-shaped.
2. **`NormalizedCardSchema`** — the canonical shape matching the `cards` table columns exactly.

Between the two, `normalizeRarity()` maps arbitrary rarity spellings onto the canonical enum via an
alias table:

```ts
"Super Rare" | "SuperRare" | "super-rare" | "SR" | "super_rare"  →  "super_rare"
```

Unrecognized rarities fall back to `"other"` rather than failing the row. Any row that fails either
schema is collected into an `errors` array (with its index and raw content) instead of aborting the
whole run — **partial success is the intended behavior** for a seeding tool; you want the 480 good
rows even if 3 are malformed.

## Import paths

### CSV / JSON (primary path today)

`csvAdapter` and `jsonAdapter` read a local file (`--file=./path`). This is the path used for the
bundled `scripts/data/sample-cards.csv` / `sample-cards.json` and is the recommended way to seed
real card data right now — hand-author or export a spreadsheet, run the seeder.

```bash
npm run seed -- --source=csv --file=./scripts/data/sample-cards.csv
npm run seed -- --source=json --file=./scripts/data/sample-cards.json
```

### Scraping (illustrative templates, not wired to a real site)

`exampleCheerioAdapter` (static HTML) and `examplePuppeteerAdapter` (JS-rendered pages) demonstrate
the adapter pattern against a documented, illustrative DOM shape (`.card-row` / `.card-name` /
`.card-rarity` / etc.) — they are **not** pointed at any real card price-guide site.

**Before pointing either adapter at a real site:**

1. Check that site's `robots.txt` and Terms of Service permit automated scraping.
2. Respect rate limits — add delays between requests; don't hammer the source.
3. Prefer an official API or data export if the source offers one.
4. Update the adapter's selectors to match the real page structure, and register a distinct
   `id` (e.g. `cheerio:some-real-site`) rather than overwriting the example.

`examplePuppeteerAdapter` in particular launches headless Chromium — this only ever runs from
`scripts/seed.ts` on a developer machine, in CI, or on a dedicated worker host with Chromium
available. It is never imported by any Next.js route or Server Action.

## Loading into Postgres (`scripts/ingest/upsertCards.ts`)

- Uses the **service-role key** (`SUPABASE_SERVICE_ROLE_KEY`), which bypasses the RLS policy that
  otherwise makes `cards` writes service-role-only (see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)).
  This key must never be committed or shipped to the client.
- Batches upserts in chunks of 500 rows to stay well under request size limits.
- Upserts on `(source, external_ref)` so re-running the seeder against the same source is
  idempotent — a card that already exists gets updated, not duplicated. Manual entries (no
  `external_ref`) always insert as new rows, since Postgres treats `NULL` as distinct in a unique
  constraint.

## Running it

```bash
npm run seed -- --source=list           # list registered adapters
npm run seed -- --source=csv --file=./scripts/data/sample-cards.csv
npm run seed -- --source=json --file=./scripts/data/sample-cards.json
npm run seed -- --source=cheerio:example --url=https://example.com/cards
```

Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (loaded via
`dotenv`, not committed).
