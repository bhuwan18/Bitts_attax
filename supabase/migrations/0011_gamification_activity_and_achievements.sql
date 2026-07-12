-- Gamification foundation: daily-activity/login-streak tracking and a real
-- achievements catalog + per-user unlock ledger.
--
-- user_achievements insert RLS only checks auth.uid() = user_id, not that the
-- achievement was actually earned (a user could in principle self-award via
-- devtools). Chosen over a security definer re-validating function because
-- achievements are cosmetic/bragging-rights, not economically consequential
-- like trade items — contrast with notify_trade_event() in
-- 0009_user_discovery_and_notifications.sql, which guards something that
-- actually matters and so runs security definer.

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_date date not null default (timezone('utc', now())::date),
  created_at timestamptz not null default now(),
  constraint activity_log_user_date_key unique (user_id, activity_date)
);

create index activity_log_user_date_idx on public.activity_log (user_id, activity_date desc);

alter table public.activity_log enable row level security;

create policy "users read their own activity log"
  on public.activity_log for select
  using (auth.uid() = user_id);

create policy "users record their own activity"
  on public.activity_log for insert
  with check (auth.uid() = user_id);

-- Static catalog, service-role-only writes — same pattern as cards/fairness_rules.
create table public.achievements (
  id text primary key,
  name text not null,
  description text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.achievements enable row level security;

create policy "achievements are publicly readable"
  on public.achievements for select
  using (true);

insert into public.achievements (id, name, description, sort_order) values
  ('first_trade', 'First Trade', 'Complete your first trade', 1),
  ('rare_hunter', 'Rare Hunter', 'Own a Rare card or better', 2),
  ('streak_5', '5-Day Streak', 'Open the app 5 days running', 3),
  ('trader_x3', 'Trader x3', 'Complete 3 trades', 4)
on conflict (id) do nothing;

-- Permanent unlock ledger: insert-only, never updated/deleted once earned.
create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  constraint user_achievements_user_achievement_key unique (user_id, achievement_id)
);

create index user_achievements_user_id_idx on public.user_achievements (user_id);

alter table public.user_achievements enable row level security;

create policy "users read their own unlocked achievements"
  on public.user_achievements for select
  using (auth.uid() = user_id);

create policy "users unlock their own achievements"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);
