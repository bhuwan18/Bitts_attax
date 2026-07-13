-- LLM-generated OVR ratings for catalog cards whose source data didn't carry
-- one (a large chunk of the catalog — see DATA_INGESTION_STRATEGY.md).
--
-- A missing ovr_rating isn't just a cosmetic gap: fairness-actions.ts coerces
-- it with `?? 0`, so an unrated card is scored as worthless in a trade, and
-- the /cards catalog sorts it to the bottom of the NULL tail.
--
-- `cards` remains a service-role-only write surface (0002_rls_policies.sql) —
-- this does NOT add a client write path to it. Estimates live in their own
-- table and are folded onto the canonical value at READ time by the
-- cards_effective view below. That buys two things a write-back into
-- cards.ovr_rating would destroy:
--   * re-seeding stays safe — an ingest upsert of `cards` can't clobber an
--     estimate, because the estimate isn't stored there;
--   * "what the source actually said" (NULL) stays recoverable and distinct
--     from "what an LLM guessed".
--
-- Rows are written from exactly one place: fairness-actions.ts, when a card is
-- put into a trade. That's the one moment a missing rating actually costs
-- something (it corrupts the score), so it's the only moment worth spending an
-- LLM call on. Rating cards nobody is trading — e.g. a "rate my whole
-- collection" button — is unbounded cost for no benefit, and was deliberately
-- rejected.
--
-- One row per card (unique card_id) makes this a SHARED cache, not per-user
-- scratch: the first trade involving a given card pays the Gemini call, every
-- trade after that (by anyone) reads the stored value.

create table public.card_ovr_estimates (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null unique references public.cards (id) on delete cascade,
  ovr_rating smallint not null check (ovr_rating between 0 and 99),
  -- 'image'     — read off the printed card face; Match Attax cards print the
  --               rating, so this is transcription, not guesswork.
  -- 'knowledge' — inferred from player/team/position/season only, because the
  --               card had no usable image. Genuinely a guess.
  source text not null check (source in ('image', 'knowledge')),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  -- Which model produced it, so a future model upgrade can find and re-run
  -- estimates made by an older one.
  model text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.card_ovr_estimates enable row level security;

-- Public read, mirroring cards' own "publicly readable" policy: an estimate is
-- only useful if it fills the gap everywhere the card is seen — the catalog,
-- another trader's portfolio, and BOTH sides of a trade's fairness score (a
-- score computed from only your own estimates would be worse than none).
create policy "card ovr estimates are publicly readable"
  on public.card_ovr_estimates for select
  using (true);

-- Authenticated users may fill a gap, never overwrite a real rating: the
-- insert is rejected outright unless the card genuinely has no canonical
-- ovr_rating. Combined with `unique (card_id)`, that means an estimate can be
-- created but not tampered with — there is deliberately no update or delete
-- policy, so revising a bad estimate is a service-role/admin operation.
create policy "authenticated users can fill missing ovr ratings"
  on public.card_ovr_estimates for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.cards c
      where c.id = card_id and c.ovr_rating is null
    )
  );

-- Column-for-column identical to `cards`, except ovr_rating is coalesced onto
-- the estimate. Identical on purpose: a read site swaps
-- .from("cards") -> .from("cards_effective") and needs no other change, since
-- the column it already reads (`ovr_rating`) simply stops being NULL. It also
-- makes `order by ovr_rating desc` sort an estimated card into its true
-- position rather than dumping it in the NULL tail.
--
-- Note the cost: ordering by the coalesced value can't use the
-- (ovr_rating, owned_count, id) indexes from 0016, so the catalog's sort
-- becomes a join + sort. Fine at this catalog's size (thousands of cards);
-- revisit if it grows by orders of magnitude.
--
-- security_invoker: the view executes as the querying user, so the RLS on
-- cards and card_ovr_estimates still applies through it. Without this it would
-- run as the view's owner and silently bypass both.
create view public.cards_effective
with (security_invoker = on) as
select
  c.id,
  c.external_ref,
  c.source,
  c.name,
  c.team,
  c."position",
  c.rarity,
  coalesce(c.ovr_rating, e.ovr_rating)::smallint as ovr_rating,
  c.base_price,
  c.image_url,
  c.set_name,
  c.season,
  c.attributes,
  c.owned_count,
  c.created_at,
  c.updated_at
from public.cards c
left join public.card_ovr_estimates e on e.card_id = c.id;

-- Repoint the photo-scan matcher (0017) at the view, so a scanned card shows
-- the same rating the catalog shows. Without this, the scan dialog would be the
-- one place still rendering a blank OVR for a card that already has an estimate.
-- Note this only READS an estimate some earlier trade paid for — scanning never
-- generates one.
--
-- Return type changes (setof cards -> setof cards_effective), which
-- `create or replace` can't do, hence the drop. The two row types are
-- column-for-column identical, so nothing downstream (including the `Card` type
-- in TS) has to change. Body is otherwise 0017's verbatim — the trigram index
-- on cards.name is still used, since the view inlines into the same scan.
drop function if exists public.match_cards_by_text(text, text, text, int);

create function public.match_cards_by_text(
  p_name text,
  p_team text default null,
  p_set_name text default null,
  match_count int default 5
)
returns setof public.cards_effective
language sql
stable
security invoker
set search_path = ''
as $$
  select c.*
  from public.cards_effective c
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

grant execute on function public.match_cards_by_text(text, text, text, int) to authenticated;
