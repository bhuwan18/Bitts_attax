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
status: "accepted" | "rejected" | "cancelled"
```
Updates a trade's status. RLS restricts this to the trade's two participants. Revalidates
`/trades/[tradeId]`. `"completed"` is deliberately not an accepted value here — see
`confirmTradeCompletion` below.

### `confirmTradeCompletion(tradeId: string): Promise<{ status: string }>`
Records that the calling participant confirms the trade is done (they've physically met and
exchanged cards), by calling the `confirm_trade_completion(p_trade_id)` Postgres RPC (see
[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md#completing-a-trade-0015_trade_completion_confirmationssql)
for the race-safe locking and the trigger it drives). Only valid while the trade's status is
`accepted`; only the trade's two participants may call it. The trade's status only actually flips to
`completed` — and the traded cards only actually move between both parties' inventories — once
**both** the initiator and counterparty have called this. Calling it again after your own
confirmation is already recorded is a safe no-op; you're just waiting on the other party.
Revalidates `/trades/[tradeId]`, `/trades`, and `/inventory` (the last in case the transfer already
happened by the time this call returns). Calls `evaluateAchievements()` if this call was the one
that finalized the trade to `completed`.

### Insufficient-stock flagging (read-only, no Server Action)

`removeInventoryItem`/`updateInventoryQuantity` (above) don't check whether the card they're
touching is committed to an open trade — editing your Haves never blocks or auto-cancels a trade.
Instead, `useTrade`/`useMyTrades` (`lib/queries/trades.ts`) each attach a computed
`availableQuantity` to every `trade_item` (the giver's *current* `inventory_items.quantity` for that
card, read via its existing public `select` policy — see
[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md#row-level-security)) and expose
`getInsufficientTradeItems(trade)`, so `TradeDetailPage`/`MyTradesList` can warn "this trade now
promises more than the giver has" without any DB writes.

## Fairness (`app/(main)/trades/[tradeId]/fairness-actions.ts`)

### `computeAndPersistFairness(tradeId: string): Promise<FairnessResult>`
1. Loads the trade's `trade_items` joined to `cards` (RLS limits this to trade participants).
2. **Generates a missing `ovr_rating` for any card in the trade that the catalog doesn't rate**, via
   `resolveOvrRatings()` (`lib/cards/ovrResolver.ts`), before scoring.
3. Loads the active `fairness_rules` row (`key = 'default'`).
4. Calls the pure `computeFairnessScore` (`lib/fairness.ts`) — see that file for the formula.
5. Persists `fairness_score` and `fairness_breakdown` onto the `trades` row.
6. Returns the full `FairnessResult` for immediate rendering (`components/trades/FairnessMeter.tsx`).

Safe to call repeatedly; each call recomputes from the trade's current items and overwrites the
stored result. The trade detail page calls this automatically the first time it loads a trade with
no stored `fairness_breakdown`.

Step 2 fixes a real scoring bug rather than adding a nicety. OVR is a weighted term in
`computeFairnessScore`, and an unrated card used to be coerced to `ovrRating: 0` — i.e. scored as
contributing nothing — which silently understated whichever side was holding it. Much of the catalog
has no OVR (incomplete source data), so this was common.

The estimate is cached in the shared `card_ovr_estimates` table, so the Gemini call happens **once
per card across the whole app**, not once per trade — the next trade involving that card is a cache
hit. It's also strictly gap-filling: a card the catalog already rates is never sent to the LLM, and
a canonical rating always wins over an estimate.

**This is the only place LLM ratings are generated, on purpose.** A card is rated when — and only
when — it's actually put into a trade, i.e. at the one moment a missing rating would otherwise
corrupt a score. A bulk "rate my whole collection" action was built and then deliberately removed:
it spends LLM calls on cards nobody is trading, which is unbounded cost for no benefit. Don't
reintroduce it, in that shape or another.

Image-first: the model reads the OVR printed on the card face (`cards.image_url`, passed by URL —
Gemini fetches it directly), and only falls back to estimating from the player when the card has no
art. The two are recorded distinctly as `source: 'image' | 'knowledge'` and never conflated.

**It never blocks the trade.** A Gemini outage, rate limit, or a card the model declines to rate
leaves that card absent from the resolved map, and it falls back to the previous `?? 0` — so a
failure here degrades to exactly the behavior the app had before this feature existed, rather than
failing the trade view.

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

## Gamification (`app/(main)/gamification/actions.ts`)

### `recordDailyActivity(localDate: string): Promise<string[]>`
`localDate` must be `YYYY-MM-DD`, not in the future, not more than a year old — validated, but
otherwise **trusted from the client** rather than computed server-side in UTC, so a session near
midnight lands on the calendar day the user actually experienced (a deliberate, low-stakes
trust-boundary choice; see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md#activity_log)). Upserts an
`activity_log` row (`onConflict: "user_id,activity_date", ignoreDuplicates: true` — a second call
the same day is a no-op), then calls `evaluateAchievements()` and returns its result. Called once
per session by `components/gamification/ActivityRecorder.tsx` (mounted in
`app/(main)/layout.tsx`, same shape as `NotificationsListener`).

### `evaluateAchievements(): Promise<string[]>`
Re-derives identity via `getUser()` (never trusts a passed id). Computes, for the caller: completed-
trade count (`trades` where `status = 'completed'` and the caller is either party), whether any
owned card is `rare`/`super_rare`/`legend`/`limited`, and current streak (`activity_log` fed through
`computeCurrentStreak`, `lib/gamification/streak.ts`). Diffs against the caller's existing
`user_achievements`, inserts any newly-qualifying ones, revalidates `/profile`, and returns the
newly-unlocked achievement ids (so the UI can toast "Unlocked: ‹name›").

Called from four places: `recordDailyActivity` above, `updateTradeStatus` (`trades/actions.ts`)
after a transition to `completed`, `addToInventory` (`inventory/actions.ts`) after success, and
`components/profile/AchievementEvaluator.tsx` once per Profile page visit as a safety net. Note that
a Server Action only ever evaluates the *calling* user's achievements — completing a trade only
updates the achievements of whichever participant clicked Accept/Complete; the other participant's
newly-completed-trade achievement is caught the next time they load their own Profile page.

Level and XP are **not** a Server Action or a stored column — `lib/gamification/level.ts`'s
`computeLevel`/`computeXpPercent` derive both from the caller's live unique-card count at render
time (`components/profile/LevelProgress.tsx`), the same "compute from real data at query time"
convention `useTraderHavesCounts()` already uses elsewhere in the app.

## Trade matches (`lib/queries/matches.ts`, `find_trade_matches()` RPC)

No Server Action — this is a read, backed by the `find_trade_matches()` Postgres function (see
[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md#find_trade_matches-rpc)). `useTradeMatches(limit?)` calls
the RPC, then one follow-up `profiles` select to resolve display names for whatever it returned (two
round trips total, not N+1). Surfaces on the Home dashboard (top 3, `components/home/TradeMatchesWidget.tsx`)
and as a badge on `/traders` rows (`components/traders/TraderCard.tsx`'s optional `match` prop) —
"Mutual match" when the intersection holds both ways, "Has what you want" otherwise.

## User discovery (`app/(main)/traders/`)

No dedicated Server Actions — `/traders` and `/traders/[userId]` are pure reads (profiles are
publicly readable, and `inventory_items` select was opened up to public in
[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md#row-level-security) `0009_user_discovery_and_notifications.sql`
specifically for this view). Proposing a trade to a discovered user reuses `proposeTrade` (above)
unchanged — it already accepts an arbitrary `counterpartyId` with `listingId: null`.

## Notifications (`app/(main)/notifications/actions.ts`)

Rows in `notifications` are never inserted by a Server Action or client call — they're created
entirely by the `notify_trade_event()` Postgres trigger on `trades` (fires on `proposeTrade`'s
insert and on `updateTradeStatus`'s status change), see
[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md#notifications). The only client-writable operation is
marking a notification read:

### `markNotificationRead(id: string): Promise<void>`
Sets `read_at = now()` on one notification. RLS restricts this to the caller's own rows.
Revalidates `/notifications`.

### `markAllNotificationsRead(): Promise<void>`
Same, for every unread notification belonging to the caller. Revalidates `/notifications`.

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
   anyone whose role isn't `'admin'` is redirected to `/` (the Home dashboard).
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
