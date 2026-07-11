-- Row Level Security policies for all Bitts Attax tables.
-- Every policy is intentionally narrow; write access to reference data
-- (cards, fairness_rules) is service_role only so the seeder can bypass RLS
-- while normal users only ever get read access to that data.

alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.inventory_items enable row level security;
alter table public.want_items enable row level security;
alter table public.trade_listings enable row level security;
alter table public.trade_listing_items enable row level security;
alter table public.trades enable row level security;
alter table public.trade_items enable row level security;
alter table public.messages enable row level security;
alter table public.fairness_rules enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users manage their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- cards: public read-only catalog, writes are service_role only (no policy
-- needed for service_role since it bypasses RLS entirely)
-- ---------------------------------------------------------------------------
create policy "cards are publicly readable"
  on public.cards for select
  using (true);

-- ---------------------------------------------------------------------------
-- inventory_items: owner-only CRUD
-- ---------------------------------------------------------------------------
create policy "users manage their own inventory"
  on public.inventory_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- want_items: owner-only CRUD
-- ---------------------------------------------------------------------------
create policy "users manage their own want list"
  on public.want_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- trade_listings: browsable by anyone, owner-only writes
-- ---------------------------------------------------------------------------
create policy "trade listings are publicly readable"
  on public.trade_listings for select
  using (true);

create policy "owners create their own listings"
  on public.trade_listings for insert
  with check (auth.uid() = owner_id);

create policy "owners update their own listings"
  on public.trade_listings for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owners delete their own listings"
  on public.trade_listings for delete
  using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- trade_listing_items: readable by anyone, writable only by the parent
-- listing's owner
-- ---------------------------------------------------------------------------
create policy "trade listing items are publicly readable"
  on public.trade_listing_items for select
  using (true);

create policy "owners manage their listing items"
  on public.trade_listing_items for all
  using (
    exists (
      select 1 from public.trade_listings tl
      where tl.id = trade_listing_items.listing_id
        and tl.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trade_listings tl
      where tl.id = trade_listing_items.listing_id
        and tl.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- trades: only visible/editable by the two participants
-- ---------------------------------------------------------------------------
create policy "participants read their trades"
  on public.trades for select
  using (auth.uid() = initiator_id or auth.uid() = counterparty_id);

create policy "initiator creates a trade"
  on public.trades for insert
  with check (auth.uid() = initiator_id);

create policy "participants update their trades"
  on public.trades for update
  using (auth.uid() = initiator_id or auth.uid() = counterparty_id)
  with check (auth.uid() = initiator_id or auth.uid() = counterparty_id);

-- ---------------------------------------------------------------------------
-- trade_items: only participants of the parent trade
-- ---------------------------------------------------------------------------
create policy "participants read trade items"
  on public.trade_items for select
  using (
    exists (
      select 1 from public.trades t
      where t.id = trade_items.trade_id
        and (auth.uid() = t.initiator_id or auth.uid() = t.counterparty_id)
    )
  );

create policy "participants add their own trade items"
  on public.trade_items for insert
  with check (
    offered_by = auth.uid()
    and exists (
      select 1 from public.trades t
      where t.id = trade_items.trade_id
        and (auth.uid() = t.initiator_id or auth.uid() = t.counterparty_id)
    )
  );

create policy "participants delete their own trade items"
  on public.trade_items for delete
  using (
    offered_by = auth.uid()
    and exists (
      select 1 from public.trades t
      where t.id = trade_items.trade_id
        and (auth.uid() = t.initiator_id or auth.uid() = t.counterparty_id)
    )
  );

-- ---------------------------------------------------------------------------
-- messages: only participants of the parent trade may read or send
-- ---------------------------------------------------------------------------
create policy "participants read trade messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.trades t
      where t.id = messages.trade_id
        and (auth.uid() = t.initiator_id or auth.uid() = t.counterparty_id)
    )
  );

create policy "participants send trade messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.trades t
      where t.id = messages.trade_id
        and (auth.uid() = t.initiator_id or auth.uid() = t.counterparty_id)
    )
  );

-- ---------------------------------------------------------------------------
-- fairness_rules: public read (client-side fairness preview), service_role
-- only for writes
-- ---------------------------------------------------------------------------
create policy "fairness rules are publicly readable"
  on public.fairness_rules for select
  using (true);
