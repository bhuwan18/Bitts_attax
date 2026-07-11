# UI Component Manifest

`components/ui/` (Shadcn/UI primitives, generated via `npx shadcn add`, built on Base UI rather
than Radix — see the `style: "base-nova"` in `components.json`) is omitted below; it's
infrastructure, not application UI. Everything else is hand-written for this app.

## Cards (`components/cards/`)

| Component | Purpose |
|---|---|
| `CardSearch.tsx` | Owns debounced search/filter state, renders `CardFilters` + `CardGrid` via `useCardsInfinite()`, plus a "Load more" button |
| `CardFilters.tsx` | Rarity and Position as pill toggles (rarity pills colored via `RARITY_STYLE`), Team and Set as `<Select>`s, all rendered inline next to the search box, plus a "Clear filters" button when any are active; Team and Set options come from the `cards_distinct_teams`/`cards_distinct_set_names` RPCs |
| `CardGrid.tsx` | Responsive grid (2/3/4/5 columns by breakpoint) with loading skeletons (`CardGridSkeleton`) and empty state |
| `CardTile.tsx` | Single card preview: image, OVR badge, name, team, rarity badge, price |
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
| `InventoryItemTile.tsx` | One owned card (grid view), same data as `InventoryItemRow.tsx` in a tile layout |
| `InventoryList.tsx` | Haves tab: `CardPicker` + list/grid of items (`InventoryViewToggle`), wired to `lib/queries/inventory.ts` mutations |
| `WantListEditor.tsx` | Wants tab: `CardPicker` + want-list rows with remove button |

Used by: `app/(main)/inventory/page.tsx` (Tabs: Haves / Wants).

## Trades (`components/trades/`)

| Component | Purpose |
|---|---|
| `TradeListingCard.tsx` | One browsable listing: haves/wants badges, "Propose Trade" button (calls `proposeTrade`) |
| `TradeBrowseList.tsx` | Fetches and renders all open listings via `useTradeListings()` |
| `TradeListingForm.tsx` | Create-listing form: title + two `HaveWantPicker`s, calls `createTradeListing` |
| `HaveWantPicker.tsx` | Search + quantity-editable list, reused for both the "haves" and "wants" side of a listing |
| `FairnessMeter.tsx` | Renders a `FairnessResult` as a labeled progress bar (color keyed to fairness label) |

Used by: `app/(main)/trades/page.tsx` (browse), `app/(main)/trades/new/page.tsx` (create),
`app/(main)/trades/[tradeId]/page.tsx` (detail — renders `FairnessMeter` plus give/get badges and
accept/decline actions).

## Traders (`components/traders/`)

| Component | Purpose |
|---|---|
| `TraderBrowseList.tsx` | Search box + list of every other user (`useTraders(search)`), each showing a Haves count (`useTraderHavesCounts()`, one query for the whole list) |
| `TraderCard.tsx` | One trader row: avatar, display name/`@username`, Haves count, links to `/traders/[userId]` |
| `TraderInventoryGrid.tsx` | Read-only grid of another user's Haves (image, name, team, quantity) — presentational, no owner controls (unlike `InventoryItemTile.tsx`) |
| `TraderWantList.tsx` | Read-only badge list of another user's Wants — lets a viewer see what to offer them, not just what to request from their Haves |
| `ProposeTradeForm.tsx` | Two-sided picker built from each party's *actual* inventory (the caller's own `useInventory()` for "Your offer", the target's `useTraderInventory(userId)` for "Their items") rather than a global card search like `HaveWantPicker.tsx`; submits via `proposeTrade` and routes to the new trade |

Used by: `app/(main)/traders/page.tsx` (browse), `app/(main)/traders/[userId]/page.tsx` (a trader's
public profile — server-rendered profile header + Haves grid, redirects to `/profile` if the id is
the caller's own).

## Notifications (`components/notifications/`)

| Component | Purpose |
|---|---|
| `NotificationBell.tsx` | Unread-count badge (`useUnreadNotificationsCount()`) + live updates (`useNotificationsChannel()`), links to `/notifications` — shown in `DesktopHeader.tsx` |
| `NotificationList.tsx` | `useNotifications()` + "Mark all read" (`useMarkAllNotificationsRead()`), renders `NotificationRow`s, empty state |
| `NotificationRow.tsx` | Per-type message text, relative timestamp, unread styling; click marks read (`markNotificationRead`) and navigates to the related `/trades/[tradeId]` |

Used by: `app/(main)/notifications/page.tsx` (the inbox). `MobileNav.tsx` renders its own
unread-dot indicator on the Inbox tab (same `useUnreadNotificationsCount()`/
`useNotificationsChannel()` hooks) rather than embedding `NotificationBell.tsx` directly, since the
bell's layout is desktop-specific.

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
| `AdminUserTable.tsx` | Full user list (`useAdminUsers()`), links each row to `/admin/users/[userId]` |
| `AdminUserActivityPanel.tsx` | One user's trades, inventory, and want-list (`useAdminUserActivity()`) |
| `AdminTradesTable.tsx` | Shared trades table (initiator/counterparty/status/fairness/created), used by both the dashboard and the user detail page |
| `AdminRecentTradesTable.tsx` | Dashboard's "recent trades" feed (`useAdminRecentTrades()`), wraps `AdminTradesTable` |
| `TradeStatusBadge.tsx` | Status-colored `Badge` for a trade, shared by `AdminTradesTable` |

Used by: `app/(main)/admin/page.tsx` (dashboard), `app/(main)/admin/users/page.tsx` (user list),
`app/(main)/admin/users/[userId]/page.tsx` (user detail). Gated by `app/(main)/admin/layout.tsx`,
which redirects non-admins to `/cards` — see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for the
`profiles.role` column and admin-only RLS policies backing this section.

## Navigation (`components/nav/`)

| Component | Purpose |
|---|---|
| `MobileNav.tsx` | Fixed bottom tab bar (Cards / Inventory / Trades / Traders / Inbox / Profile, plus Admin for admins) — mobile only (`md:hidden`); the Inbox tab shows its own unread dot |
| `DesktopHeader.tsx` | Sticky top nav with the same links, plus `NotificationBell.tsx` next to `ThemeToggle` — desktop only (`hidden md:block`) |
| `LogoutButton.tsx` | Signs out via Supabase and redirects to `/login` |

Used by: `app/(main)/layout.tsx` wraps every authenticated route with both `DesktopHeader` and
`MobileNav`; only one renders at a given viewport width (mobile-first responsive shell).

## Providers (`components/providers/`)

| Component | Purpose |
|---|---|
| `QueryProvider.tsx` | TanStack Query client, one per browser session |
| `SupabaseProvider.tsx` | Memoized Supabase browser client exposed via `useSupabase()` |

Both wrap the entire app in `app/layout.tsx`, alongside Shadcn's `TooltipProvider` and `Toaster`
(sonner) for mutation error/success feedback.

## Data-fetching hooks (`lib/queries/`, `lib/realtime/`)

Not components, but the client-side data layer every component above depends on:

- `lib/queries/cards.ts` — `useCards(filters)` (used by `HaveWantPicker`/`CardPicker`), `useCard(id)`, `useCardsInfinite(filters)` (used by `CardSearch`, paginated via `lib/queries/cardsShared.ts`)
- `lib/queries/inventory.ts` — `useInventory()`, `useWantList()`, plus mutation hooks wrapping each Server Action
- `lib/queries/trades.ts` — `useTradeListings()`, `useTrade(tradeId)`
- `lib/queries/messages.ts` — `useMessages(tradeId)`, `useSendMessage(tradeId)`
- `lib/queries/traders.ts` — `useTraders(search?)`, `useTraderHavesCounts()`, `useTraderProfile(userId)`, `useTraderInventory(userId)`, `useTraderWantList(userId)` — reliant on the public `select` policies on `inventory_items`/`want_items` added in `0009_user_discovery_and_notifications.sql`/`0010_want_items_public_read.sql`
- `lib/queries/notifications.ts` — `useNotifications()`, `useUnreadNotificationsCount()`, `useMarkNotificationRead()`, `useMarkAllNotificationsRead()`
- `lib/queries/auth.ts` — `useCurrentUser()`, `useCurrentProfile()` (own `profiles` row, incl. `role` — used to conditionally show the Admin nav link)
- `lib/queries/admin.ts` — `useAdminUsers()`, `useAdminRecentTrades()`, `useAdminUserActivity(userId)`, all reliant on the admin-only RLS `select` policies in `supabase/migrations/0007_admin_role.sql`
- `lib/realtime/useTradeChannel.ts` — subscribes to the trade's chat channel and pushes inserts into the `["messages", tradeId]` query cache
- `lib/realtime/useNotificationsChannel.ts` — subscribes to a channel-per-user (`notifications` filtered by `user_id`) and invalidates the `["notifications"]` queries on insert
