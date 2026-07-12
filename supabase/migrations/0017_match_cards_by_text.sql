-- Photo-scan add-to-inventory flow: after a vision call extracts name/team/set text
-- from a photographed physical card (app/(main)/inventory/photo-match-actions.ts),
-- this RPC fuzzy-matches that text against the `cards` catalog using pg_trgm's
-- similarity(), for the same reason cards_distinct_teams() (0006) and
-- find_trade_matches() (0012) exist: postgrest-js can't express a custom
-- ORDER BY similarity() combined with a WHERE floor in its query builder.
-- pg_trgm was created without an explicit schema in 0001_init_schema.sql and
-- lives in `public` (confirmed via its show_trgm/show_limit helper functions),
-- so similarity() is called unqualified-but-still-under-search_path-'' below
-- via the public. prefix, same as every other object this function touches.
--
-- p_team / p_set_name are optional secondary signals: present, they nudge ranking
-- (a name match whose team also matches outranks one that doesn't) but never
-- exclude a row outright — OCR on a team/set string is less reliable than on a
-- player name, and a strict AND filter would zero out otherwise-good name matches.
create or replace function public.match_cards_by_text(
  p_name text,
  p_team text default null,
  p_set_name text default null,
  match_count int default 5
)
returns setof public.cards
language sql
stable
security invoker
set search_path = ''
as $$
  select c.*
  from public.cards c
  where public.similarity(c.name, p_name) > 0.25
  order by
    public.similarity(c.name, p_name)
      + case when p_team is not null and c.team is not null
             then 0.15 * public.similarity(c.team, p_team) else 0 end
      + case when p_set_name is not null and c.set_name is not null
             then 0.1 * public.similarity(c.set_name, p_set_name) else 0 end
    desc,
    c.owned_count desc,
    c.id
  limit greatest(1, least(match_count, 25));
$$;

-- Authenticated only, like find_trade_matches() (0012) rather than
-- cards_distinct_teams()'s anon+authenticated grant (0006). cards is public
-- data either way, but this RPC only serves the authenticated add-to-inventory
-- photo-scan flow — no anonymous surface calls it, and it runs immediately
-- after a requireUser()-gated external API call. Narrowing the grant is a
-- second, independent layer of intent-matching, defense in depth rather than
-- the actual security boundary (RLS on `cards` already governs what any caller
-- can see).
grant execute on function public.match_cards_by_text(text, text, text, int) to authenticated;
