# UI Component Manifest

`components/ui/` (Shadcn/UI primitives, generated via `npx shadcn add`, built on Base UI rather
than Radix — see the `style: "base-nova"` in `components.json`) is omitted below; it's
infrastructure, not application UI. Everything else is hand-written for this app.

## Home (`components/home/`)

| Component | Purpose |
|---|---|
| `HomeDashboard.tsx` | Client composition root for the Home dashboard: stat row + `StreakBanner` + `TradeMatchesWidget` + `RecentCardsRail` |
| `StreakBanner.tsx` | Current login-streak banner (`useCurrentStreak()`), renders nothing if the streak is 0 |
| `RecentCardsRail.tsx` | Horizontal `ScrollArea` of the catalog's most-owned cards (`useMostOwnedCards()`), reuses `CardTile` |
| `TradeMatchesWidget.tsx` | Top-3 trade matches (`useTradeMatches(3)`), each linking to `/traders/[userId]` |

Used by: `app/(main)/page.tsx` — the authenticated landing route (`/`), a Server Component that
fetches the display name for the welcome header and mounts `HomeDashboard`. `proxy.ts` gives root
`/` its own exact-match protection check rather than joining the prefix-based list, since every
pathname starts with `/`.

## Cards (`components/cards/`)

| Component | Purpose |
|---|---|
| `CardSearch.tsx` | Owns debounced search/filter state, renders `CardFilters` + `CardGrid` via `useCardsInfinite()`, plus a "Load more" button |
| `CardFilters.tsx` | Rarity and Position as pill toggles (rarity pills colored via `RARITY_STYLE`), Team and Set as `<Select>`s, all rendered inline next to the search box, plus a "Clear filters" button when any are active; Team and Set options come from the `cards_distinct_teams`/`cards_distinct_set_names` RPCs |
| `CardGrid.tsx` | Responsive grid (2/3/4/5 columns by breakpoint) with loading skeletons (`CardGridSkeleton`) and empty state |
| `CardTile.tsx` | Single card preview: gradient image frame with a rarity-colored border + glow (`RARITY_BORDER_CLASS`/`RARITY_GLOW_CLASS`, `lib/cards/rarity.ts`), OVR badge, name, team, rarity chip, price |
| `AddToInventoryDialog.tsx` | Confirmation dialog for adding the current card to the user's Haves; lets the user attach their own photo (file picker or device camera via `capture="environment"`) instead of the stock `cards.image_url` before confirming, via `useAddToInventory()`. Relabels to "Edit in Inventory" and pre-fills quantity/photo when the card is already owned. |

Used by: `app/(main)/cards/page.tsx` (browse — server-rendered, prefetches the first page and
hydrates `CardSearch`'s TanStack Query cache), `app/(main)/cards/[cardId]/page.tsx` (detail,
server-rendered — also loads the caller's own `inventory_items` row for this card, if any, to
render `AddToInventoryDialog` and tag a user-uploaded hero image with a "Your photo" badge).

## Inventory (`components/inventory/`)

| Component | Purpose |
|---|---|
| `CardPicker.tsx` | Shared search-and-add widget (used by both Haves and Wants tabs) |
| `InventoryItemRow.tsx` | One owned card (list view): image, name, team, quantity input, remove button; shows a "Your photo" badge when `custom_image_url` is set |
| `InventoryItemTile.tsx` | One owned card (grid view), same data as `InventoryItemRow.tsx` in a tile layout, now with the same rarity border+glow treatment as `CardTile.tsx` |
| `InventoryList.tsx` | Haves tab: `CardPicker` + list/grid of items (`InventoryViewToggle`), wired to `lib/queries/inventory.ts` mutations |
| `WantListEditor.tsx` | Wants tab: `CardPicker` + want-list rows with remove button |

Used by: `app/(main)/inventory/page.tsx` (Tabs: Haves / Wants).

## Trades (`components/trades/`)

| Component | Purpose |
|---|---|
| `TradeListingCard.tsx` | One browsable listing: haves/wants badges, "Propose Trade" button (calls `proposeTrade`) |
| `TradeBrowseList.tsx` | Fetches and renders all open listings via `useTradeListings()` |
| `TradeListingForm.tsx` | Create-listing form: two `HaveWantPicker`s (offer/want) first, then a value-balance hint, a live `ListingPreview`, an optional title, and a requirement-gated submit; calls `createTradeListing` |
| `HaveWantPicker.tsx` | Rich card picker (thumbnail + team + OVR), reused for both listing sides; surfaces `suggestions` (the caller passes inventory for Haves, want-list for Wants) before the user types, falls back to catalog search via `useCards`, and marks already-added cards. Exports `CardOption`/`PickedItem` + `cardToOption` |
| `ListingPreview.tsx` | Read-only preview mirroring `TradeListingCard`'s offering/looking-for pills, shown live as the form is filled |
| `FairnessMeter.tsx` | Renders a `FairnessResult` as a labeled progress bar (color keyed to fairness label) |
| `MyTradesList.tsx` | `useMyTrades()` — every trade the caller is a party to (either side), grouped into an active list and a "Completed" section below it; give/get item badges, status badge, links to the trade detail page and its chat, a Cancel button (`updateTradeStatus(id, "cancelled")`) shown only to the initiator while `status === "proposed"`, a Mark complete button (`confirmTradeCompletion`) shown while `status === "accepted"` and the caller hasn't already confirmed — with a "Waiting for ‹name› to confirm…" line once they have — and a compact warning banner (`getInsufficientTradeItems`) when a giver has since edited their Haves below what the trade still promises |

Used by: `app/(main)/trades/page.tsx` (Tabs: Browse — `TradeBrowseList` — / My Trades —
`MyTradesList`), `app/(main)/trades/new/page.tsx` (create), `app/(main)/trades/[tradeId]/page.tsx`
(detail — renders `FairnessMeter`, give/get badges, accept/decline actions, the same Mark complete /
"waiting on the other party" flow as `MyTradesList.tsx`, and a per-card breakdown of the same
insufficient-stock warning).

## Traders (`components/traders/`)

| Component | Purpose |
|---|---|
| `TraderBrowseList.tsx` | Search box + list of every other user (`useTraders(search)`), each showing a Haves count (`useTraderHavesCounts()`) and a trade-match badge (`useTradeMatches(100)`, both one query for the whole list, not per-row) |
| `TraderCard.tsx` | One trader row: avatar, display name/`@username`, optional match badge ("Mutual match"/"Has what you want"), Haves count, links to `/traders/[userId]` |
| `TraderInventoryGrid.tsx` | Read-only grid of another user's Haves (image, name, team, quantity) — presentational, no owner controls (unlike `InventoryItemTile.tsx`) |
| `TraderWantList.tsx` | Read-only badge list of another user's Wants — lets a viewer see what to offer them, not just what to request from their Haves |
| `ProposeTradeForm.tsx` | Two-sided picker built from each party's *actual* inventory (the caller's own `useInventory()` for "Your offer", the target's `useTraderInventory(userId)` for "Their items") rather than a global card search like `HaveWantPicker.tsx`; submits via `proposeTrade` and routes to the new trade |

Used by: `app/(main)/traders/page.tsx` (browse), `app/(main)/traders/[userId]/page.tsx` (a trader's
public profile — server-rendered profile header + Haves grid, redirects to `/profile` if the id is
the caller's own).

## Profile & Gamification (`components/profile/`, `components/gamification/`)

| Component | Purpose |
|---|---|
| `profile/ProfileDashboard.tsx` | Client composition root mounted below the Profile page's server-rendered header: `LevelProgress` + a `StatStrip` (total/unique cards, trades done) + `AchievementBadgeGrid` + `AchievementEvaluator` |
| `profile/LevelProgress.tsx` | Level number + XP fill bar, derived from unique-card count via `lib/gamification/level.ts` (not stored) |
| `profile/AchievementBadgeGrid.tsx` | 2/4-column badge grid (`useAchievements()` catalog × `useUnlockedAchievements()`), dimmed at 35% opacity when locked; icon per achievement id is a hardcoded lookup, not stored data |
| `profile/AchievementEvaluator.tsx` | Renders nothing — fires `evaluateAchievements()` once per Profile visit as a safety net, toasts newly-unlocked achievements |
| `gamification/ActivityRecorder.tsx` | Renders nothing — fires `recordDailyActivity()` once per session with the browser's local calendar date, backing the login-streak feature |

Used by: `app/(main)/profile/page.tsx` (own profile — server-rendered avatar/name/username/email +
`ProfileDashboard`), `app/(main)/layout.tsx` (mounts `ActivityRecorder` alongside
`NotificationsListener`). See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for the
`activity_log`/`achievements`/`user_achievements` tables and
[API_SPECIFICATION.md](./API_SPECIFICATION.md) for the Server Actions backing all of this.

## Notifications (`components/notifications/`)

| Component | Purpose |
|---|---|
| `NotificationBell.tsx` | Unread-count badge (`useUnreadNotificationsCount()`) + live updates (`useNotificationsChannel()`), links to `/notifications` — its only mount point is `TopBar.tsx` |
| `NotificationList.tsx` | `useNotifications()` + "Mark all read" (`useMarkAllNotificationsRead()`), renders `NotificationRow`s, empty state |
| `NotificationRow.tsx` | Per-type message text, relative timestamp, unread styling; click marks read (`markNotificationRead`) and navigates to the related `/trades/[tradeId]` |

Used by: `app/(main)/notifications/page.tsx` (the inbox).

## Chat (`components/chat/`)

| Component | Purpose |
|---|---|
| `ChatInterface.tsx` | Composes `useMessages` (initial fetch) + `useTradeChannel` (Realtime) + message list + `MessageInput`, auto-scrolls to newest message |
| `MessageBubble.tsx` | One message, left/right-aligned by sender, shows sender name for the counterparty's messages |
| `MessageInput.tsx` | Auto-growing textarea + send button, Enter-to-send (Shift+Enter for newline) |

Used by: `app/(main)/trades/[tradeId]/chat/page.tsx`.

## Admin (`components/admin/`)

| Component | Purpose |
|---|---|
| `AdminNav.tsx` | Dashboard/Users tab row shown at the top of every `/admin` page |
| `AdminUserTable.tsx` | Full user list (`useAdminUsers()`), links each row to `/admin/users/[username]` |
| `AdminUserActivityPanel.tsx` | One user's trades, inventory, and want-list (`useAdminUserActivity()`) |
| `AdminTradesTable.tsx` | Shared trades table (initiator/counterparty/status/fairness/created), used by both the dashboard and the user detail page |
| `AdminRecentTradesTable.tsx` | Dashboard's "recent trades" feed (`useAdminRecentTrades()`), wraps `AdminTradesTable` |
| `TradeStatusBadge.tsx` | Status-colored `Badge` for a trade, shared by `AdminTradesTable` |

Used by: `app/(main)/admin/page.tsx` (dashboard), `app/(main)/admin/users/page.tsx` (user list),
`app/(main)/admin/users/[username]/page.tsx` (user detail). Gated by `app/(main)/admin/layout.tsx`,
which redirects non-admins to `/` — see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for the
`profiles.role` column and admin-only RLS policies backing this section.

## Navigation (`components/nav/`)

One universal nav shell — no sidebar, no desktop/mobile split. `TopBar` + `BottomNav` render at
every screen size and orientation (a prior pass had a left sidebar on wide screens; deliberately
replaced by this floating pill everywhere per direct feedback that it worked better universally).

| Component | Purpose |
|---|---|
| `TopBar.tsx` | Sticky top bar — deliberately full-bleed (matches each page's own `px-4 sm:px-6` rather than centering in its own max-width, so the wordmark stays flush with whatever container the page below uses, which varies from `max-w-2xl` to `max-w-6xl`). Logo/wordmark (links to `/`, no active-state styling — that read as a stray chip on a brand mark) + a conditional Admin `Shield` link (only relevant to a handful of users, so it doesn't take a permanent slot in `BottomNav`) + `NotificationBell.tsx`; this is the bell's only mount point |
| `BottomNav.tsx` | Fixed floating pill nav, inset from the screen edges (not edge-to-edge), opaque `bg-card` with a soft brand-color ambient glow (`nav-float-glow` utility) rather than translucent glassmorphism. Cards is elevated into its own separate floating glowing button above the pill (the app's "hero" content gets star billing, the same idea as an Instagram-style floating create button); the pill itself holds Home / Inventory / Trades / Traders / Profile — Home needs an exact pathname match (`href === "/"`), not `startsWith`, since every route starts with `/` |
| `LogoutButton.tsx` | Signs out via Supabase and redirects to `/login` |

Used by: `app/(main)/layout.tsx`, a simple vertical stack — `TopBar` → `<main>` (with bottom padding
reserved so content never sits under the floating nav) → `BottomNav`. No responsive branching at
the layout level at all; `BottomNav`'s own pill width is capped by design (`max-w-md`), not by the
viewport, so it looks the same (centered, capped-width) whether the screen is a phone or a desktop
monitor.

## Providers (`components/providers/`)

| Component | Purpose |
|---|---|
| `QueryProvider.tsx` | TanStack Query client, one per browser session |
| `SupabaseProvider.tsx` | Memoized Supabase browser client exposed via `useSupabase()` |

Both wrap the entire app in `app/layout.tsx`, alongside Shadcn's `TooltipProvider` and `Toaster`
(sonner) for mutation error/success feedback.

## Data-fetching hooks (`lib/queries/`, `lib/realtime/`)

Not components, but the client-side data layer every component above depends on:

- `lib/queries/cards.ts` — `useCards(filters)` (used by `HaveWantPicker`/`CardPicker`), `useCard(id)`, `useCardsInfinite(filters)` (used by `CardSearch`, paginated + sorted by `ovr_rating desc, owned_count desc, id asc` via `lib/queries/cardsShared.ts`), `useMostOwnedCards(limit?)` (used by `RecentCardsRail`, sorted by `owned_count desc, created_at desc`)
- `lib/queries/inventory.ts` — `useInventory()`, `useWantList()`, plus mutation hooks wrapping each Server Action
- `lib/queries/trades.ts` — `useTradeListings()`, `useTrade(tradeId)`, `useMyTrades()` (every trade the caller is a party to, for `MyTradesList`) — both attach a computed (not stored) `availableQuantity` per item and expose `getInsufficientTradeItems(trade)` to flag a giver's Haves having dropped below what an open trade still promises — `useMyCompletedTradesCount()` (used by `ProfileDashboard`'s stat row and `evaluateAchievements`' `trader_x3` check)
- `lib/queries/matches.ts` — `useTradeMatches(limit?)`, wraps the `find_trade_matches()` RPC + a follow-up `profiles` lookup
- `lib/queries/gamification.ts` — `useCurrentStreak()`, `useAchievements()` (public catalog), `useUnlockedAchievements()`
- `lib/queries/messages.ts` — `useMessages(tradeId)`, `useSendMessage(tradeId)`
- `lib/queries/traders.ts` — `useTraders(search?)`, `useTraderHavesCounts()`, `useTraderProfile(userId)`, `useTraderInventory(userId)`, `useTraderWantList(userId)` — reliant on the public `select` policies on `inventory_items`/`want_items` added in `0009_user_discovery_and_notifications.sql`/`0010_want_items_public_read.sql`
- `lib/queries/notifications.ts` — `useNotifications()`, `useUnreadNotificationsCount()`, `useMarkNotificationRead()`, `useMarkAllNotificationsRead()`
- `lib/queries/auth.ts` — `useCurrentUser()`, `useCurrentProfile()` (own `profiles` row, incl. `role` — used to conditionally show the Admin nav link)
- `lib/queries/admin.ts` — `useAdminUsers()`, `useAdminRecentTrades()`, `useAdminUserActivity(userId)`, all reliant on the admin-only RLS `select` policies in `supabase/migrations/0007_admin_role.sql`
- `lib/gamification/streak.ts`, `lib/gamification/level.ts` — pure functions (not query hooks) behind `useCurrentStreak()` and `LevelProgress.tsx` respectively; same "pure function + thin query wrapper" shape as `lib/fairness.ts`
- `lib/realtime/useTradeChannel.ts` — subscribes to the trade's chat channel and pushes inserts into the `["messages", tradeId]` query cache
- `lib/realtime/useNotificationsChannel.ts` — subscribes to a channel-per-user (`notifications` filtered by `user_id`) and invalidates the `["notifications"]` queries on insert
