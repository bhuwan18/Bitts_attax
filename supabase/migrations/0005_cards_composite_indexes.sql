-- Composite indexes for /cards "Load more" pagination (lib/queries/cardsShared.ts):
-- list queries order by ovr_rating desc (tie-broken by id) and optionally filter
-- by rarity or team. Single-column indexes from 0001_init_schema.sql can't satisfy
-- "filter + sort" in one index scan; these composites can.
create index cards_rarity_ovr_rating_id_idx
  on public.cards (rarity, ovr_rating desc, id);

create index cards_team_ovr_rating_id_idx
  on public.cards (team, ovr_rating desc, id);
