-- One open proposal per listing, per proposer.
--
-- Nothing previously stopped the same user from proposing against the same
-- listing repeatedly: proposeTrade() went straight from validation to insert,
-- the insert policy only checks `auth.uid() = initiator_id`, and Browse's
-- "Propose trade" button re-arms as soon as you navigate back to it. A
-- double-click or a second visit produced duplicate, identical trades.
--
-- The guard lives here rather than as a select-then-insert check in the Server
-- Action because only a constraint is safe against two concurrent proposals
-- racing past each other's check (the double-click case, precisely).
--
-- Two deliberate edges, both encoded in the WHERE clause:
--
--   * `listing_id is not null` — a direct proposal from a trader's profile
--     (ProposeTradeForm, which passes listingId: null) isn't against a listing,
--     so the rule doesn't apply to it. Postgres already treats NULLs as
--     distinct in a unique index; this states the intent rather than leaning on
--     that.
--   * `status in ('proposed', 'accepted')` — only a *live* trade blocks a new
--     one. Once yours is rejected or cancelled you're free to propose again,
--     rather than being locked out of that listing forever. 'completed' is
--     likewise excluded: a listing whose trade went through should be closed
--     out, not enforced against here.
--
-- proposeTrade() maps the resulting 23505 to a readable message; the Browse
-- card points at the existing trade instead of offering a duplicate.

-- Existing duplicates have to go first — Postgres won't build a unique index
-- over rows that already violate it. Keep the earliest live proposal for each
-- (listing, proposer) and cancel the rest. Cancelling rather than deleting
-- preserves each trade's items and chat history, and leaves the rows readable
-- in My Trades instead of vanishing them out from under whoever is looking at
-- one right now.
with ranked as (
  select
    id,
    row_number() over (
      partition by listing_id, initiator_id
      order by created_at, id
    ) as rn
  from public.trades
  where listing_id is not null
    and status in ('proposed', 'accepted')
)
update public.trades t
set status = 'cancelled',
    updated_at = now()
from ranked
where t.id = ranked.id
  and ranked.rn > 1;

create unique index trades_one_open_proposal_per_listing
  on public.trades (listing_id, initiator_id)
  where listing_id is not null and status in ('proposed', 'accepted');
