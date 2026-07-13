-- Per-trader Haves counts, aggregated in the database.
--
-- This replaces a client query that selected *every* inventory_items row in the
-- table (`select user_id`, no filter, no limit) and counted them up in JS. That
-- had two problems, and the second is the serious one:
--
--   1. It shipped the whole table to every client on every visit to Home (the
--      Active-traders spotlight) and /traders, growing with total app-wide
--      inventory rather than with anything on screen.
--   2. It was silently wrong past PostgREST's `max-rows` cap (1000 by default on
--      Supabase): the response was truncated, so the counts simply came out too
--      low, with no error to notice. An aggregate returns one row per user, so
--      it stays well under the cap and stays correct.
--
-- `security invoker` + inventory_items' existing public-read policy (0009) mean
-- this exposes nothing a client couldn't already read directly — same reasoning
-- as find_trade_matches() in 0012.
--
-- Output column is `trader_id`, not `user_id`, purely to keep the returned
-- column names distinct from the underlying table's.
create or replace function public.inventory_haves_counts()
returns table (trader_id uuid, haves_count integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select ii.user_id, count(*)::int
  from public.inventory_items ii
  group by ii.user_id;
$$;

-- Counts are only ever rendered to a signed-in user browsing other traders.
grant execute on function public.inventory_haves_counts() to authenticated;
