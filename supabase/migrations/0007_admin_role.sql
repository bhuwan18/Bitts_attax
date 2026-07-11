-- Adds an admin role and grants admins read-only visibility into the
-- otherwise owner/participant-scoped inventory_items, want_items, trades,
-- and trade_items tables (user list + activity view). trade_listings/
-- trade_listing_items are already publicly readable; messages is
-- intentionally left untouched so trade chat stays private between its
-- two participants.
--
-- Bootstrap the first admin by hand after this migration is applied
-- (deliberately not baked into the migration, which would otherwise commit
-- a real email to version control):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');

alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'admin'));

-- No security-definer function needed: profiles' own select policy is
-- `using (true)`, so this exists() check can't recurse back into a
-- restricted policy.
create policy "admins can read all inventory items"
  on public.inventory_items for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admins can read all want items"
  on public.want_items for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admins can read all trades"
  on public.trades for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admins can read all trade items"
  on public.trade_items for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
