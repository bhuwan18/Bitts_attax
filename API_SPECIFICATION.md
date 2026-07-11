# API Specification

Bitts Attax has no separate REST API layer. All writes go through **Next.js Server Actions**
(`"use server"` functions), called directly from client components like RPC calls. Every action
re-derives the caller's identity from their session-scoped Supabase client
(`supabase.auth.getUser()`) — nothing trusts a client-supplied user id — and every write is subject
to the RLS policies in [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) regardless of what the action
code does.

Reads are done directly from client components via the Supabase JS client + TanStack Query
(`lib/queries/*.ts`), or from Server Components at request time (`lib/supabase/server.ts`) — see
[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md). There isn't a separate "read API" to document
beyond "query the table, RLS decides what you see."

## Inventory (`app/(main)/inventory/actions.ts`)

### `addToInventory(cardId: string, quantity = 1, image?: File | null): Promise<void>`
Upserts an `inventory_items` row for the current user (unique on `user_id, card_id`, so re-adding a
card updates its quantity instead of duplicating). Requires auth. Revalidates `/inventory` and
`/cards/[cardId]`.

If `image` is passed, it's validated (≤8MB, `image/jpeg|png|webp|heic|heif`) and uploaded to the
`card-images` storage bucket under the caller's own folder (`{user.id}/{card_id}-{timestamp}.{ext}`,
enforced by storage RLS — see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md#storage)), and its public
URL is written to `custom_image_url` on the row. Omitting `image` (`undefined`) leaves whatever
`custom_image_url` is already stored untouched — re-adding an already-owned card without picking a
new photo doesn't wipe a previously uploaded one.

### `updateInventoryQuantity(itemId: string, quantity: number): Promise<void>`
Updates the quantity on an existing inventory row. `quantity` validated 1–999. RLS restricts this
to rows owned by the caller. Revalidates `/inventory`.

### `removeInventoryItem(itemId: string): Promise<void>`
Deletes an inventory row. Revalidates `/inventory`.

### `addWantItem(cardId: string): Promise<void>`
Upserts a `want_items` row for the current user. Revalidates `/inventory`.

### `removeWantItem(itemId: string): Promise<void>`
Deletes a want-list row. Revalidates `/inventory`.

## Trading (`app/(main)/trades/actions.ts`)

### `createTradeListing(input): Promise<{ listingId: string }>`
```ts
input: {
  title?: string;
  haves: { cardId: string; quantity: number }[]; // min 1
  wants: { cardId: string; quantity: number }[]; // min 1
}
```
Validated against `CreateListingSchema` (`lib/validation/trade.schema.ts`). Inserts a
`trade_listings` row owned by the caller, then the corresponding `trade_listing_items` rows.
Revalidates `/trades`.

### `proposeTrade(input): Promise<{ tradeId: string }>`
```ts
input: {
  listingId: string | null;
  counterpartyId: string;
  myItems: { cardId: string; quantity: number }[];
  theirItems: { cardId: string; quantity: number }[];
}
```
Validated against `ProposeTradeSchema`. Rejects proposing a trade with yourself. Inserts a `trades`
row (`initiator_id` = caller, status defaults to `proposed`) and the corresponding `trade_items`
(caller's items tagged `offered_by = caller`, counterparty's items tagged `offered_by =
counterpartyId`). Revalidates `/trades`.

### `updateTradeStatus(tradeId: string, status): Promise<void>`
```ts
status: "accepted" | "rejected" | "completed" | "cancelled"
```
Updates a trade's status. RLS restricts this to the trade's two participants. Revalidates
`/trades/[tradeId]`.

## Fairness (`app/(main)/trades/[tradeId]/fairness-actions.ts`)

### `computeAndPersistFairness(tradeId: string): Promise<FairnessResult>`
1. Loads the trade's `trade_items` joined to `cards` (RLS limits this to trade participants).
2. Loads the active `fairness_rules` row (`key = 'default'`).
3. Calls the pure `computeFairnessScore` (`lib/fairness.ts`) — see that file for the formula.
4. Persists `fairness_score` and `fairness_breakdown` onto the `trades` row.
5. Returns the full `FairnessResult` for immediate rendering (`components/trades/FairnessMeter.tsx`).

Safe to call repeatedly; each call recomputes from the trade's current items and overwrites the
stored result. The trade detail page calls this automatically the first time it loads a trade with
no stored `fairness_breakdown`.

```ts
interface FairnessResult {
  score: number;              // 0–100, 100 = perfectly even
  label: "very_fair" | "fair" | "slightly_uneven" | "uneven" | "very_uneven";
  sideA: { priceTotal: number; rarityScore: number; ovrTotal: number; compositeValue: number };
  sideB: { priceTotal: number; rarityScore: number; ovrTotal: number; compositeValue: number };
  deltaPct: number;
}
```

## Chat (`app/(main)/trades/[tradeId]/chat/actions.ts`)

### `sendMessage(tradeId: string, body: string): Promise<void>`
Validated against `SendMessageSchema` (body 1–2000 chars). Inserts a `messages` row with
`sender_id` = caller. RLS restricts this to trade participants. The insert is what triggers the
Realtime broadcast that other participants' `useTradeChannel` subscription receives — see
[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md).

## Auth

Handled directly by the Supabase client SDK, not custom Server Actions:

- `supabase.auth.signUp({ email, password, options: { data: { username, display_name } } })` — `app/(auth)/signup`
- `supabase.auth.signInWithPassword({ email, password })` — `app/(auth)/login`
- `supabase.auth.signInWithOtp({ email })` — `app/(auth)/magic-link`
- `supabase.auth.signOut()` — `components/nav/LogoutButton.tsx`
- `GET /auth/callback` (`app/(auth)/auth/callback/route.ts`) — exchanges the magic-link/signup
  confirmation `code` for a session, then redirects into the app.

## Admin (`app/(main)/admin/`)

Read-only — there are no admin Server Actions, only reads gated two ways:

1. `app/(main)/admin/layout.tsx` calls `getCurrentProfile()` (`lib/auth/admin.ts`), which
   re-derives identity via `supabase.auth.getUser()` then loads that user's `profiles.role`;
   anyone whose role isn't `'admin'` is redirected to `/cards`.
2. Independently, the admin-only `select` RLS policies added in
   `supabase/migrations/0007_admin_role.sql` (`inventory_items`, `want_items`, `trades`,
   `trade_items`) mean the underlying queries return data for admins and nothing extra for
   everyone else — so the page guard above is a UX nicety, not the actual security boundary.

`lib/queries/admin.ts` exposes `useAdminUsers()`, `useAdminRecentTrades(limit?)`, and
`useAdminUserActivity(userId)` (that user's inventory, want-list, and trades) — see
[UI_COMPONENT_MANIFEST.md](./UI_COMPONENT_MANIFEST.md) for the pages/components built on them.

Promoting a user to `role = 'admin'` is a manual SQL step (documented in the migration), not a
Server Action — there is intentionally no self-serve promotion UI.

## Data ingestion (not a runtime API)

`scripts/seed.ts` is a standalone CLI, not part of the app's request/response surface — see
[DATA_INGESTION_STRATEGY.md](./DATA_INGESTION_STRATEGY.md).
