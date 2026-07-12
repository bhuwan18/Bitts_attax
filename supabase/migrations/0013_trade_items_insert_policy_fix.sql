-- ---------------------------------------------------------------------------
-- Fix trade_items insert policy: proposeTrade() has the initiator insert
-- items for BOTH sides in one call (their own items tagged offered_by =
-- themselves, the counterparty's requested items tagged offered_by =
-- counterparty). The counterparty never edits trade_items — they only
-- accept/reject the proposal as-is (see app/(main)/trades/[tradeId]/page.tsx).
-- The original "offered_by = auth.uid()" check therefore rejected every
-- proposal that requested any item from the counterparty.
-- ---------------------------------------------------------------------------

drop policy "participants add their own trade items" on public.trade_items;

create policy "initiator sets trade items at proposal"
  on public.trade_items for insert
  with check (
    exists (
      select 1 from public.trades t
      where t.id = trade_items.trade_id
        and auth.uid() = t.initiator_id
        and offered_by in (t.initiator_id, t.counterparty_id)
    )
  );
