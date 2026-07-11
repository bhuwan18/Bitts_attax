-- Support for the /cards filter panel's position and set_name facets
-- (lib/queries/cardsShared.ts, components/cards/CardFilters.tsx).

-- position/set_name filters and the composite (facet, ovr_rating desc, id)
-- indexes follow the same pattern as 0005_cards_composite_indexes.sql's
-- rarity/team indexes, for the same "filter + sort" query shape.
create index cards_position_idx on public.cards ("position");
create index cards_set_name_idx on public.cards (set_name);

create index cards_position_ovr_rating_id_idx
  on public.cards ("position", ovr_rating desc, id);

create index cards_set_name_ovr_rating_id_idx
  on public.cards (set_name, ovr_rating desc, id);

-- team/set_name are free-text columns with no fixed value set (unlike
-- rarity), and postgrest-js has no DISTINCT support in its query builder —
-- these functions back the Team/Set dropdown options in the filter panel.
-- `security invoker` + `set search_path = ''` follow Supabase's hardening
-- guidance for SQL functions; invoker rights mean the existing "cards are
-- publicly readable" RLS policy still governs what each caller sees.
create or replace function public.cards_distinct_teams()
returns table (team text)
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct team from public.cards where team is not null order by team;
$$;

create or replace function public.cards_distinct_set_names()
returns table (set_name text)
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct set_name from public.cards where set_name is not null order by set_name;
$$;

grant execute on function public.cards_distinct_teams() to anon, authenticated;
grant execute on function public.cards_distinct_set_names() to anon, authenticated;
