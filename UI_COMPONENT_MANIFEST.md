# UI Component Manifest

`components/ui/` (Shadcn/UI primitives, generated via `npx shadcn add`, built on Base UI rather
than Radix — see the `style: "base-nova"` in `components.json`) is omitted below; it's
infrastructure, not application UI. Everything else is hand-written for this app.

## Cards (`components/cards/`)

| Component | Purpose |
|---|---|
| `CardSearch.tsx` | Owns debounced search/filter state, renders `CardFilters` + `CardGrid` via `useCardsInfinite()`, plus a "Load more" button |
| `CardFilters.tsx` | "Filters" button (with an active-count badge) opening a `Sheet` panel with Rarity/Position/Team/Set `<Select>`s; Team and Set options come from the `cards_distinct_teams`/`cards_distinct_set_names` RPCs |
| `CardGrid.tsx` | Responsive grid (2/3/4/5 columns by breakpoint) with loading skeletons (`CardGridSkeleton`) and empty state |
| `CardTile.tsx` | Single card preview: image, OVR badge, name, team, rarity badge, price |

Used by: `app/(main)/cards/page.tsx` (browse — server-rendered, prefetches the first page and
hydrates `CardSearch`'s TanStack Query cache), `app/(main)/cards/[cardId]/page.tsx` (detail,
server-rendered).

## Inventory (`components/inventory/`)

| Component | Purpose |
|---|---|
| `CardPicker.tsx` | Shared search-and-add widget (used by both Haves and Wants tabs) |
| `InventoryItemRow.tsx` | One owned card: image, name, team, quantity input, remove button |
| `InventoryList.tsx` | Haves tab: `CardPicker` + list of `InventoryItemRow`, wired to `lib/queries/inventory.ts` mutations |
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

## Chat (`components/chat/`)

| Component | Purpose |
|---|---|
| `ChatInterface.tsx` | Composes `useMessages` (initial fetch) + `useTradeChannel` (Realtime) + message list + `MessageInput`, auto-scrolls to newest message |
| `MessageBubble.tsx` | One message, left/right-aligned by sender, shows sender name for the counterparty's messages |
| `MessageInput.tsx` | Auto-growing textarea + send button, Enter-to-send (Shift+Enter for newline) |

Used by: `app/(main)/trades/[tradeId]/chat/page.tsx`.

## Navigation (`components/nav/`)

| Component | Purpose |
|---|---|
| `MobileNav.tsx` | Fixed bottom tab bar (Cards / Inventory / Trades / Profile) — mobile only (`md:hidden`) |
| `DesktopHeader.tsx` | Sticky top nav with the same links — desktop only (`hidden md:block`) |
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
- `lib/queries/auth.ts` — `useCurrentUser()`
- `lib/realtime/useTradeChannel.ts` — subscribes to the trade's chat channel and pushes inserts into the `["messages", tradeId]` query cache
