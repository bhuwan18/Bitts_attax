-- Trade-matches discovery: a single-round-trip RPC rather than 4 chained
-- client queries + a JS join, for the same reason 0006 added the
-- cards_distinct_*() functions — postgrest-js can't express "intersect two
-- users' card sets, group, flag mutual" in one request. `security invoker` +
-- inventory_items/want_items' existing public-read policies (0009, 0010)
-- mean this exposes nothing a client couldn't already see directly.
create or replace function public.find_trade_matches()
returns table (other_user_id uuid, they_have_count integer, mutual boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  with my_wants as (
    select card_id from public.want_items where user_id = auth.uid()
  ),
  my_spares as (
    select card_id from public.inventory_items
    where user_id = auth.uid() and quantity > 1
  ),
  they_have as (
    select ii.user_id as other_user_id, count(*)::int as they_have_count
    from public.inventory_items ii
    join my_wants mw on mw.card_id = ii.card_id
    where ii.user_id <> auth.uid()
    group by ii.user_id
  ),
  they_want_my_spare as (
    select distinct wi.user_id as other_user_id
    from public.want_items wi
    join my_spares ms on ms.card_id = wi.card_id
    where wi.user_id <> auth.uid()
  )
  select th.other_user_id, th.they_have_count, (twms.other_user_id is not null) as mutual
  from they_have th
  left join they_want_my_spare twms on twms.other_user_id = th.other_user_id
  order by mutual desc, th.they_have_count desc;
$$;

-- Narrower than 0006's anon+authenticated grant — matches only make sense
-- for a signed-in user with a want-list.
grant execute on function public.find_trade_matches() to authenticated;
