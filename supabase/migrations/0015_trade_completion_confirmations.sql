-- Both participants must independently confirm a trade before it's marked
-- completed (they've physically met and exchanged cards) — a unilateral
-- status flip would let either party mark it done without the other's
-- agreement. Once both confirmations are in, trg_transfer_trade_items moves
-- the traded cards between the two participants' inventories and clears any
-- now-fulfilled want-list entries.

alter table public.trades
  add column initiator_completed_at timestamptz,
  add column counterparty_completed_at timestamptz;

-- security invoker: RLS's existing "participants update their trades" policy
-- already grants the caller full row access, so this runs with the caller's
-- own privileges rather than escalating anything. `select ... for update`
-- locks the row so two near-simultaneous confirmations can't both observe
-- the other party's field as still null — whichever call runs second always
-- sees the first call's committed write, so the status flip to 'completed'
-- can't be lost to a race.
create or replace function public.confirm_trade_completion(p_trade_id uuid)
returns public.trades
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_trade public.trades;
begin
  select * into v_trade from public.trades where id = p_trade_id for update;

  if not found then
    raise exception 'Trade not found.';
  end if;

  if auth.uid() <> v_trade.initiator_id and auth.uid() <> v_trade.counterparty_id then
    raise exception 'You are not a participant in this trade.';
  end if;

  if v_trade.status <> 'accepted' then
    raise exception 'Only accepted trades can be marked complete.';
  end if;

  if auth.uid() = v_trade.initiator_id then
    v_trade.initiator_completed_at := coalesce(v_trade.initiator_completed_at, now());
  end if;
  if auth.uid() = v_trade.counterparty_id then
    v_trade.counterparty_completed_at := coalesce(v_trade.counterparty_completed_at, now());
  end if;

  if v_trade.initiator_completed_at is not null and v_trade.counterparty_completed_at is not null then
    v_trade.status := 'completed';
  end if;

  update public.trades
  set initiator_completed_at = v_trade.initiator_completed_at,
      counterparty_completed_at = v_trade.counterparty_completed_at,
      status = v_trade.status
  where id = p_trade_id
  returning * into v_trade;

  return v_trade;
end;
$$;

grant execute on function public.confirm_trade_completion(uuid) to authenticated;

-- security definer: moving cards between two users' inventories needs to
-- write both parties' inventory_items/want_items rows, but RLS on both
-- tables is owner-only (0002_rls_policies.sql) — the confirming user's own
-- session can't write the other party's rows. Only ever invoked by the
-- trigger below, never reachable directly by a client (mirrors
-- notify_trade_event()'s security-definer rationale in
-- 0009_user_discovery_and_notifications.sql).
create or replace function public.transfer_trade_items()
returns trigger
security definer set search_path = public
language plpgsql as $$
declare
  item record;
  receiver uuid;
begin
  for item in select * from trade_items where trade_id = new.id loop
    receiver := case when item.offered_by = new.initiator_id then new.counterparty_id else new.initiator_id end;

    -- Clamp at 0 rather than erroring — a giver may have edited their
    -- inventory between proposing and completing the trade.
    update inventory_items
    set quantity = greatest(quantity - item.quantity, 0)
    where user_id = item.offered_by and card_id = item.card_id;

    delete from inventory_items
    where user_id = item.offered_by and card_id = item.card_id and quantity = 0;

    insert into inventory_items (user_id, card_id, quantity)
    values (receiver, item.card_id, item.quantity)
    on conflict (user_id, card_id)
    do update set quantity = inventory_items.quantity + excluded.quantity;

    -- The receiver no longer "wants" a card they just received.
    delete from want_items
    where user_id = receiver and card_id = item.card_id;
  end loop;

  return new;
end;
$$;

create trigger trg_transfer_trade_items
  after update of status on public.trades
  for each row
  when (new.status = 'completed' and old.status is distinct from 'completed')
  execute function public.transfer_trade_items();
