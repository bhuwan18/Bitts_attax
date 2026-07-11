-- Adds user discovery (public read on inventory_items, additive alongside the
-- existing owner-only policy — same technique as the admin bypass policies in
-- 0007_admin_role.sql) and a notifications inbox.
--
-- Notifications are only ever created by the trigger below, never inserted by
-- a client — there is deliberately no insert/delete RLS policy for this table,
-- so one user can't write into another user's inbox. This mirrors the trust
-- model used everywhere else in the app (nothing trusts client-supplied ids).

create policy "inventory items are publicly readable"
  on public.inventory_items for select
  using (true);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in (
    'trade_proposed', 'trade_accepted', 'trade_rejected', 'trade_completed', 'trade_cancelled'
  )),
  trade_id uuid references public.trades(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

create policy "users read their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "users mark their own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- security definer so the insert into notifications succeeds regardless of
-- the calling user's own RLS grants on that table (they have none); auth.uid()
-- still resolves to the session's own jwt claim inside a security definer
-- function, so the "who did this" branch below is not spoofable.
create or replace function public.notify_trade_event()
returns trigger
security definer set search_path = public
language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.notifications (user_id, actor_id, type, trade_id)
    values (new.counterparty_id, new.initiator_id, 'trade_proposed', new.id);
  elsif TG_OP = 'UPDATE' and new.status is distinct from old.status then
    insert into public.notifications (user_id, actor_id, type, trade_id)
    values (
      case when auth.uid() = new.initiator_id then new.counterparty_id else new.initiator_id end,
      auth.uid(),
      'trade_' || new.status,
      new.id
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_trade_insert
  after insert on public.trades
  for each row execute function public.notify_trade_event();

create trigger trg_notify_trade_status
  after update of status on public.trades
  for each row execute function public.notify_trade_event();

alter publication supabase_realtime add table public.notifications;
