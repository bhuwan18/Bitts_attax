-- Denormalized ownership counter on cards (sum of inventory_items.quantity
-- across ALL users for that card), kept in sync by trigger rather than
-- computed at read time. Two read sites need it — the dashboard rail
-- (lib/queries/cards.ts) and the paginated/filtered /cards catalog
-- (lib/queries/cardsShared.ts fetchCardsPage) — and postgrest-js can't
-- express a `group by` aggregate from either's query builder. A per-site RPC
-- would have to duplicate fetchCardsPage's filter/pagination logic in SQL;
-- a plain column lets both just add .order("owned_count", ...).
alter table public.cards
  add column owned_count integer not null default 0;

update public.cards c
set owned_count = coalesce(
  (select sum(ii.quantity) from public.inventory_items ii where ii.card_id = c.id), 0
);

create or replace function public.sync_card_owned_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    update cards set owned_count = coalesce(
      (select sum(quantity) from inventory_items where card_id = old.card_id), 0
    ) where id = old.card_id;
    return old;
  end if;

  update cards set owned_count = coalesce(
    (select sum(quantity) from inventory_items where card_id = new.card_id), 0
  ) where id = new.card_id;

  if tg_op = 'UPDATE' and old.card_id is distinct from new.card_id then
    update cards set owned_count = coalesce(
      (select sum(quantity) from inventory_items where card_id = old.card_id), 0
    ) where id = old.card_id;
  end if;

  return new;
end;
$$;

create trigger sync_card_owned_count
  after insert or update of quantity, card_id or delete on public.inventory_items
  for each row execute function public.sync_card_owned_count();

-- Supersede 0005's composites: /cards now sorts ovr_rating desc, owned_count
-- desc, id asc (see fetchCardsPage), so the filter+sort indexes need the
-- extra key to stay a single index scan instead of a filter + separate sort.
drop index if exists public.cards_rarity_ovr_rating_id_idx;
drop index if exists public.cards_team_ovr_rating_id_idx;

create index cards_rarity_ovr_rating_owned_id_idx
  on public.cards (rarity, ovr_rating desc, owned_count desc, id);
create index cards_team_ovr_rating_owned_id_idx
  on public.cards (team, ovr_rating desc, owned_count desc, id);
-- Unfiltered case: default /cards view and the dashboard rail's own
-- owned_count-desc, created_at-desc ordering.
create index cards_ovr_rating_owned_id_idx
  on public.cards (ovr_rating desc, owned_count desc, id);
create index cards_owned_count_created_at_idx
  on public.cards (owned_count desc, created_at desc);
