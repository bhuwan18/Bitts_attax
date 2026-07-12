# Database Schema

Full SQL lives in `supabase/migrations/`, applied in order:

1. `0001_init_schema.sql` — tables, constraints, indexes, triggers
2. `0002_rls_policies.sql` — Row Level Security policies
3. `0003_fairness_config_seed.sql` — seeds the default fairness config
4. `0004_realtime_publication.sql` — adds `messages` to `supabase_realtime`
5. `0005_cards_composite_indexes.sql` — composite `(rarity, ovr_rating desc, id)` /
   `(team, ovr_rating desc, id)` indexes for the `/cards` "Load more" query shape
6. `0006_cards_filter_facets.sql` — `position`/`set_name` indexes (single-column and
   composite, same pattern as 0005) plus `cards_distinct_teams()` /
   `cards_distinct_set_names()` RPC functions backing the filter panel's Team/Set dropdowns
7. `0007_admin_role.sql` — adds `profiles.role` and admin-only read policies on
   `inventory_items`/`want_items`/`trades`/`trade_items` for the admin user list/activity view
8. `0008_inventory_custom_images.sql` — adds `inventory_items.custom_image_url` plus the public
   `card-images` storage bucket + owner-scoped storage policies backing it
9. `0009_user_discovery_and_notifications.sql` — adds a public `select` policy on
   `inventory_items` (user discovery — see below), the `notifications` table, its RLS policies, and
   the `notify_trade_event()` trigger that populates it
10. `0010_want_items_public_read.sql` — adds a public `select` policy on `want_items`, same
    additive technique as `0009`'s `inventory_items` policy, so a trader's profile can show what
    they're looking for alongside their Haves
11. `0011_gamification_activity_and_achievements.sql` — adds `activity_log` (one row per user per
    calendar day, backing login-streak computation), `achievements` (a static catalog, seeded), and
    `user_achievements` (a permanent per-user unlock ledger)
12. `0012_trade_matches_rpc.sql` — adds the `find_trade_matches()` RPC, a single-round-trip
    set-intersection query over the already-public `inventory_items`/`want_items` (same
    `postgrest-js` limitation `cards_distinct_teams()` et al. work around in `0006`)
13. `0013_trade_items_insert_policy_fix.sql` — replaces the `trade_items` insert policy so the
    initiator can insert items tagged `offered_by` = either participant at proposal time (the
    original policy only allowed `offered_by = auth.uid()`, rejecting any requested counterparty item)
14. `0014_google_oauth_display_name.sql` — makes `handle_new_user()` prefer Google OAuth's
    `full_name`/`name`/`avatar_url` metadata over the email-handle fallback, and backfills profiles
    stuck with the old fallback
15. `0015_trade_completion_confirmations.sql` — adds `trades.initiator_completed_at`/
    `counterparty_completed_at`, the `confirm_trade_completion()` RPC (race-safe two-party
    confirmation), and the `transfer_trade_items()` trigger that moves traded cards between both
    parties' inventories once both confirm — see below
16. `0016_cards_owned_count.sql` — adds `cards.owned_count` (sum of `inventory_items.quantity`
    across all users, for a global popularity ranking) plus the `sync_card_owned_count()` trigger
    that keeps it in sync on every `inventory_items` write, and replaces the `0005`
    rarity/team composite indexes with versions that include `owned_count` — see below

All tables live in the `public` schema. `auth.users` is Supabase-managed.

## Entity relationship overview

```mermaid
erDiagram
    PROFILES ||--o{ INVENTORY_ITEMS : owns
    PROFILES ||--o{ WANT_ITEMS : wants
    PROFILES ||--o{ TRADE_LISTINGS : creates
    PROFILES ||--o{ TRADES : "initiates / receives"
    PROFILES ||--o{ MESSAGES : sends
    PROFILES ||--o{ NOTIFICATIONS : receives
    TRADES ||--o{ NOTIFICATIONS : "generates (trigger)"
    CARDS ||--o{ INVENTORY_ITEMS : "referenced by"
    CARDS ||--o{ WANT_ITEMS : "referenced by"
    CARDS ||--o{ TRADE_LISTING_ITEMS : "referenced by"
    CARDS ||--o{ TRADE_ITEMS : "referenced by"
    TRADE_LISTINGS ||--o{ TRADE_LISTING_ITEMS : has
    TRADE_LISTINGS ||--o{ TRADES : "may originate"
    TRADES ||--o{ TRADE_ITEMS : has
    TRADES ||--o{ MESSAGES : has
    PROFILES ||--o{ ACTIVITY_LOG : logs
    PROFILES ||--o{ USER_ACHIEVEMENTS : unlocks
    ACHIEVEMENTS ||--o{ USER_ACHIEVEMENTS : "unlocked as"
```

## Tables

### `profiles`
1:1 with `auth.users`; auto-created by the `handle_new_user()` trigger on signup.
`display_name`/`avatar_url` prefer OAuth metadata (`full_name`/`name`/`avatar_url`/`picture` — the
keys Google populates in `raw_user_meta_data`) over the email-address-derived fallback used for
plain email/password signup (`0014_google_oauth_display_name.sql`).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `references auth.users(id) on delete cascade` |
| `username` | `text` | unique, not null |
| `display_name` | `text` | nullable |
| `avatar_url` | `text` | nullable |
| `role` | `text` | check: `user, admin`; default `'user'` — promoted by hand via SQL, no self-serve UI |
| `created_at` / `updated_at` | `timestamptz` | default `now()` |

### `cards`
Canonical card catalog — public read, service-role write only.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `external_ref` | `text` | source-system id, nullable |
| `source` | `text` | e.g. `manual`, `csv`, `cheerio:example`; unique with `external_ref` |
| `name` | `text` | not null |
| `team` | `text` | nullable |
| `position` | `text` | nullable |
| `rarity` | `text` | check: `common, uncommon, rare, super_rare, legend, limited, other` |
| `ovr_rating` | `smallint` | check 0–99 |
| `base_price` | `numeric(10,2)` | check ≥ 0; feeds the fairness engine |
| `image_url` | `text` | nullable |
| `set_name`, `season` | `text` | nullable |
| `attributes` | `jsonb` | flexible bag for extra stat breakdowns |
| `owned_count` | `integer` | default 0; denormalized sum of `inventory_items.quantity` across **all** users for this card, kept in sync by the `sync_card_owned_count()` trigger on `inventory_items` (`0016_cards_owned_count.sql`) — a global popularity signal, not the current user's own quantity |
| `created_at` / `updated_at` | `timestamptz` | |

Indexes: `gin (name gin_trgm_ops)` (supports `ilike` search); btree on `rarity`, `ovr_rating`,
`team`, `position`, `set_name`; composite `(facet, ovr_rating desc, owned_count desc, id)` on each
of `rarity`/`team` and a plain `(ovr_rating desc, owned_count desc, id)` for the unfiltered case,
matching the `/cards` "Load more" query's `ovr_rating desc, owned_count desc, id asc` sort
(`0016_cards_owned_count.sql`, superseding `0005`'s two-column versions); `position`/`set_name`
composites from `0006` are unchanged. A separate `(owned_count desc, created_at desc)` index backs
the dashboard's "Most owned" rail. Requires the `pg_trgm` extension (enabled in the migration).

RPC functions: `cards_distinct_teams()`, `cards_distinct_set_names()` — return the distinct
non-null values of those free-text columns, used to populate the `/cards` filter panel's Team and
Set dropdowns (`postgrest-js` has no `DISTINCT` support in its query builder).

### `inventory_items` ("Haves")
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` | → `profiles(id)` |
| `card_id` | `uuid` | → `cards(id)` |
| `quantity` | `integer` | default 1, ≥ 0 |
| `condition` | `text` | default `'good'` |
| `notes` | `text` | nullable |
| `custom_image_url` | `text` | nullable — a user's own photo of their physical card, in the `card-images` storage bucket, overriding the catalog's stock `cards.image_url` wherever this row's image is shown |

Unique on `(user_id, card_id)` — adding an owned duplicate upserts quantity rather than duplicating rows.

### `want_items` ("Wants")
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` | → `profiles(id)` |
| `card_id` | `uuid` | → `cards(id)` |
| `priority` | `smallint` | default 0 |

Unique on `(user_id, card_id)`.

### `trade_listings`
Public "I have X, I want Y" advertisement.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `owner_id` | `uuid` | → `profiles(id)` |
| `title` | `text` | nullable |
| `status` | `text` | check: `open, pending, completed, cancelled` |
| `fairness_score` | `numeric(5,2)` | cached, nullable |

### `trade_listing_items`
Line items for a listing, tagged `have` or `want`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `listing_id` | `uuid` | → `trade_listings(id)` |
| `card_id` | `uuid` | → `cards(id)` |
| `side` | `text` | check: `have, want` |
| `quantity` | `integer` | > 0 |

### `trades`
A concrete negotiation between two users — distinct from `trade_listings` so a negotiation can
diverge from the original listing's terms.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `listing_id` | `uuid` | → `trade_listings(id)`, nullable (`on delete set null`) |
| `initiator_id` | `uuid` | → `profiles(id)` |
| `counterparty_id` | `uuid` | → `profiles(id)` |
| `status` | `text` | check: `proposed, accepted, rejected, completed, cancelled` |
| `fairness_score` | `numeric(5,2)` | nullable until computed |
| `fairness_breakdown` | `jsonb` | full `FairnessResult` snapshot, for auditability |
| `initiator_completed_at` | `timestamptz` | nullable — set once the initiator confirms the trade is done |
| `counterparty_completed_at` | `timestamptz` | nullable — set once the counterparty confirms the trade is done |

Check constraint: `initiator_id <> counterparty_id`.

#### Completing a trade (`0015_trade_completion_confirmations.sql`)

`status` only ever reaches `'completed'` through both participants independently confirming — never
by either party (or a Server Action) setting `status = 'completed'` directly, so
`app/(main)/trades/actions.ts`'s `updateTradeStatus` deliberately doesn't accept `"completed"` as a
value; only `confirmTradeCompletion(tradeId)` can produce that transition, by calling the
`confirm_trade_completion(p_trade_id)` RPC:

- `security invoker` — RLS's existing "participants update their trades" policy already grants the
  caller full row access, so no privilege escalation is needed.
- `select ... for update` locks the row, so two participants confirming within the same instant
  can't both observe the other's confirmation column as still null — whichever call runs second
  always sees the first call's committed write. This is what makes "both confirmed" race-safe rather
  than a lost update.
- Sets the caller's own `initiator_completed_at`/`counterparty_completed_at`, and flips `status` to
  `'completed'` in the same statement only once both columns are non-null. Raises if the trade isn't
  `'accepted'` or the caller isn't a participant.

Because the finalizing call's `UPDATE` explicitly targets `status` (even when only one side has
confirmed and the value doesn't change), the existing `trg_notify_trade_status` trigger
(`after update of status`, `0009`) fires on every confirmation call, but its own `new.status is
distinct from old.status` guard means a `trade_completed` notification is only actually created on
the call that finalizes the transition.

`trg_transfer_trade_items` (`after update of status ... when (new.status = 'completed' and
old.status is distinct from 'completed')`) then runs `transfer_trade_items()`, which is
`security definer` (same rationale as `notify_trade_event()` — moving cards touches both parties'
`inventory_items`/`want_items` rows, and RLS on both is owner-only, so the confirming user's own
session can't write the other party's rows). For each `trade_items` row it decrements the giver's
`inventory_items` quantity (clamped at 0 with `greatest()`, then deletes the row if it hits 0 —
defensive against the giver having edited their inventory between proposing and completing),
upserts the receiver's `inventory_items` quantity (`on conflict (user_id, card_id) do update`), and
deletes any matching `want_items` row for the receiver (they no longer want a card they just
received). It's only ever invoked by the trigger, never reachable directly by a client.

### `trade_items`
Concrete cards each party contributes to a specific trade (distinct from `trade_listing_items`).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `trade_id` | `uuid` | → `trades(id)` |
| `offered_by` | `uuid` | → `profiles(id)` — which party contributes this item |
| `card_id` | `uuid` | → `cards(id)` |
| `quantity` | `integer` | > 0 |

### `messages`
Chat tied to a trade; channel-per-trade Realtime pattern (see [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `trade_id` | `uuid` | → `trades(id)` |
| `sender_id` | `uuid` | → `profiles(id)` |
| `body` | `text` | ≤ 2000 chars |
| `created_at` | `timestamptz` | indexed with `trade_id` |

### `notifications`
Recipient's inbox row for a trade lifecycle event. Rows are only ever created by the
`notify_trade_event()` trigger on `trades` (see below) — there is intentionally no client insert
path.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` | → `profiles(id)` — the recipient |
| `actor_id` | `uuid` | → `profiles(id)`, nullable — who caused the event |
| `type` | `text` | check: `trade_proposed, trade_accepted, trade_rejected, trade_completed, trade_cancelled` |
| `trade_id` | `uuid` | → `trades(id)` on delete cascade |
| `read_at` | `timestamptz` | nullable — unread until set |
| `created_at` | `timestamptz` | default `now()` |

Indexes: `(user_id, created_at desc)` for the inbox list; partial `(user_id) where read_at is null`
for the unread-count query. Added to the `supabase_realtime` publication so the notification bell
updates live (same technique as `messages` in `0004_realtime_publication.sql`).

`notify_trade_event()` (`security definer`, mirrors `handle_new_user()`'s pattern in
`0001_init_schema.sql`) fires `after insert on trades` (creates a `trade_proposed` row for the
counterparty) and `after update of status on trades` (creates a `trade_<status>` row for whichever
party didn't make the change, inferred from `auth.uid()` inside the trigger).

### `fairness_rules` (TradeFairnessRules)
Table-driven weights so the fairness heuristic is tunable without a code deploy.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `key` | `text` | unique, e.g. `'default'` |
| `rarity_weights` | `jsonb` | `{"common":1,"uncommon":1.2,"rare":1.5,"super_rare":2,"legend":3,"limited":4,"other":1}` |
| `ovr_weight` | `numeric` | default 0.5 |
| `price_weight` | `numeric` | default 1.0 |
| `tolerance_pct` | `numeric` | default 10.0 — % delta still considered "fair" |
| `is_active` | `boolean` | default true |

Seeded with a `key='default'` row in `0003_fairness_config_seed.sql` so the fairness function
always has a config to read.

### `activity_log`
One row per user per calendar day, backing the login-streak feature (`lib/gamification/streak.ts`
turns a set of dates into a "current consecutive-day streak" count). `activity_date` is written from
the *client's* local date (see `app/(main)/gamification/actions.ts`'s `recordDailyActivity`), not
server UTC, so a session near midnight lands on the calendar day the user actually experienced.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` | → `profiles(id)` |
| `activity_date` | `date` | default today (UTC, but normally overridden by the caller) |
| `created_at` | `timestamptz` | default `now()` |

Unique on `(user_id, activity_date)` — a second visit the same day is a no-op upsert
(`ignoreDuplicates: true`), not a second row.

### `achievements`
Static catalog, service-role-seeded, publicly readable. Icon choice is resolved client-side by id
(`components/profile/AchievementBadgeGrid.tsx`), not stored here.

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | e.g. `first_trade`, `rare_hunter`, `streak_5`, `trader_x3` |
| `name` | `text` | display name |
| `description` | `text` | display description |
| `sort_order` | `smallint` | default 0 |
| `created_at` | `timestamptz` | default `now()` |

### `user_achievements`
Permanent unlock ledger — insert-only, never updated or deleted once earned. Evaluated by
`evaluateAchievements()` (`app/(main)/gamification/actions.ts`) against real counts (completed
trades, rarity ownership, streak length), called after key events (trade completed, card added,
daily activity recorded) plus once per Profile page visit as a safety net.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` | → `profiles(id)` |
| `achievement_id` | `text` | → `achievements(id)` |
| `unlocked_at` | `timestamptz` | default `now()` |

Unique on `(user_id, achievement_id)`.

### `find_trade_matches()` RPC
Trade-matches discovery — for the calling user, finds other users whose `inventory_items`
intersect the caller's `want_items`, flagging `mutual: true` when the reverse also holds (their
`want_items` intersects one of the caller's spare — `quantity > 1` — `inventory_items`). A single
SQL function rather than 4 chained client queries + a JS join, for the same reason `0006` added the
`cards_distinct_*()` functions. `security invoker`, granted to `authenticated` only (narrower than
the cards facet functions' `anon`+`authenticated` — a match only makes sense for a signed-in user
with a want-list). Returns `(other_user_id uuid, they_have_count integer, mutual boolean)`, backing
the Home dashboard's "Trade matches" widget and a match badge on `/traders` rows
(`lib/queries/matches.ts`).

## Row Level Security

Every table has RLS enabled. Summary (full policies in `0002_rls_policies.sql`):

| Table | Policy |
|---|---|
| `profiles` | select: public; insert/update: `auth.uid() = id` only |
| `cards` | select: public; writes: service-role only (no client policy — bypassed by the seeder's service key) |
| `inventory_items` | full CRUD only where `auth.uid() = user_id`; **plus** select for admins (`profiles.role = 'admin'`); **plus** select: public (`0009`, for the Traders discovery view — writes are still owner-only) |
| `want_items` | full CRUD only where `auth.uid() = user_id`; **plus** select for admins; **plus** select: public (`0010`, shown on a trader's public profile — writes are still owner-only) |
| `trade_listings` | select: public; insert/update/delete: owner only |
| `trade_listing_items` | select: public; insert/update/delete: only if the parent listing's `owner_id = auth.uid()` |
| `trades` | select/update: `auth.uid() in (initiator_id, counterparty_id)`; insert: `auth.uid() = initiator_id`; **plus** select for admins. The `completed` transition additionally goes through the `confirm_trade_completion()` RPC (`security invoker`, so still bound by this same policy) rather than a raw update — see [Completing a trade](#completing-a-trade-0015_trade_completion_confirmationssql) above |
| `trade_items` | select: participants of parent trade; insert: only the trade's `initiator_id` (who sets both sides' items at proposal time — the counterparty only accepts/rejects, never edits items), and only for `offered_by in (initiator_id, counterparty_id)`; delete: the participant whose `offered_by = auth.uid()`; **plus** select for admins |
| `messages` | select/insert: `auth.uid() in (initiator_id, counterparty_id)` of the parent trade — the core privacy gate for chat; deliberately **not** given an admin bypass, so trade chat stays private |
| `fairness_rules` | select: public; write: service-role only |
| `notifications` | select/update: `auth.uid() = user_id` (update is how a row gets marked read); **no insert/delete policy** — rows are only created by the `notify_trade_event()` trigger |
| `activity_log` | select/insert: `auth.uid() = user_id` only |
| `achievements` | select: public; writes: service-role only (seeded catalog) |
| `user_achievements` | select/insert: `auth.uid() = user_id` only — insert checks *who* is unlocking, not whether the achievement was actually earned (client-trusted; see `evaluateAchievements()`'s doc comment for why that's an acceptable trade-off here) |

The admin bypass policies (`0007_admin_role.sql`) are read-only and additive — they grant an
extra `select` path alongside the existing owner/participant policies rather than replacing them,
and check the caller's own `profiles.role` via `exists (select 1 from public.profiles p where
p.id = auth.uid() and p.role = 'admin')`, the same cross-table pattern already used by the
`trade_items`/`trade_listing_items`/`messages` policies above.

Policies that join through a second table (`trade_listing_items` → `trade_listings`, `trade_items`/`messages` → `trades`)
were each verified with a manual two-user test rather than trusted on "no error" alone.

## Storage

| Bucket | Public | Notes |
|---|---|---|
| `card-images` | yes (read) | User-uploaded photos of physical cards, referenced by `inventory_items.custom_image_url`. Object path convention: `{auth.uid()}/{card_id}-{timestamp}.{ext}`. `storage.objects` policies (`0008_inventory_custom_images.sql`) restrict insert/update/delete to the path's own `{auth.uid()}` folder (`(storage.foldername(name))[1] = auth.uid()::text`); select is public since the bucket itself is public and these are just card photos. |
