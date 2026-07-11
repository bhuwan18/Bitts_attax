-- Bitts Attax initial schema
-- Tables: profiles, cards, inventory_items, want_items, trade_listings,
-- trade_listing_items, trades, trade_items, messages, fairness_rules

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- cards: canonical catalog
-- ---------------------------------------------------------------------------
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  external_ref text,
  source text not null default 'manual',
  name text not null,
  team text,
  "position" text,
  rarity text not null check (
    rarity in ('common', 'uncommon', 'rare', 'super_rare', 'legend', 'limited', 'other')
  ),
  ovr_rating smallint check (ovr_rating between 0 and 99),
  base_price numeric(10, 2) check (base_price >= 0),
  image_url text,
  set_name text,
  season text,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cards_source_external_ref_key unique (source, external_ref)
);

-- Supports ilike '%term%' search from lib/queries/cards.ts.
create index cards_name_trgm_idx on public.cards using gin (name gin_trgm_ops);
create index cards_rarity_idx on public.cards (rarity);
create index cards_ovr_rating_idx on public.cards (ovr_rating);
create index cards_team_idx on public.cards (team);

-- ---------------------------------------------------------------------------
-- inventory_items: a user's owned cards ("Haves")
-- ---------------------------------------------------------------------------
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete restrict,
  quantity integer not null default 1 check (quantity >= 0),
  condition text default 'good',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_items_user_card_key unique (user_id, card_id)
);

create index inventory_items_user_id_idx on public.inventory_items (user_id);

-- ---------------------------------------------------------------------------
-- want_items: a user's standing wishlist ("Wants")
-- ---------------------------------------------------------------------------
create table public.want_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  priority smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint want_items_user_card_key unique (user_id, card_id)
);

create index want_items_user_id_idx on public.want_items (user_id);

-- ---------------------------------------------------------------------------
-- trade_listings: public "I have X, I want Y" offer
-- ---------------------------------------------------------------------------
create table public.trade_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  status text not null default 'open' check (status in ('open', 'pending', 'completed', 'cancelled')),
  fairness_score numeric(5, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trade_listings_owner_id_idx on public.trade_listings (owner_id);
create index trade_listings_status_idx on public.trade_listings (status);

-- ---------------------------------------------------------------------------
-- trade_listing_items: line items for a listing, tagged have/want
-- ---------------------------------------------------------------------------
create table public.trade_listing_items (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.trade_listings (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete restrict,
  side text not null check (side in ('have', 'want')),
  quantity integer not null default 1 check (quantity > 0)
);

create index trade_listing_items_listing_side_idx on public.trade_listing_items (listing_id, side);

-- ---------------------------------------------------------------------------
-- trades: an actual negotiation instance between two users
-- ---------------------------------------------------------------------------
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.trade_listings (id) on delete set null,
  initiator_id uuid not null references public.profiles (id) on delete cascade,
  counterparty_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'proposed' check (
    status in ('proposed', 'accepted', 'rejected', 'completed', 'cancelled')
  ),
  fairness_score numeric(5, 2),
  fairness_breakdown jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trades_distinct_parties check (initiator_id <> counterparty_id)
);

create index trades_initiator_id_idx on public.trades (initiator_id);
create index trades_counterparty_id_idx on public.trades (counterparty_id);

-- ---------------------------------------------------------------------------
-- trade_items: concrete cards each party contributes to a specific trade
-- ---------------------------------------------------------------------------
create table public.trade_items (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades (id) on delete cascade,
  offered_by uuid not null references public.profiles (id),
  card_id uuid not null references public.cards (id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0)
);

create index trade_items_trade_id_idx on public.trade_items (trade_id);

-- ---------------------------------------------------------------------------
-- messages: chat tied to a trade
-- ---------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index messages_trade_id_created_at_idx on public.messages (trade_id, created_at);

-- ---------------------------------------------------------------------------
-- fairness_rules (TradeFairnessRules): tunable weights for the fairness engine
-- ---------------------------------------------------------------------------
create table public.fairness_rules (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  rarity_weights jsonb not null,
  ovr_weight numeric not null default 0.5,
  price_weight numeric not null default 1.0,
  tolerance_pct numeric not null default 10.0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- updated_at maintenance trigger, reused across tables
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.cards
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.inventory_items
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.trade_listings
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.trades
  for each row execute function public.set_updated_at();
