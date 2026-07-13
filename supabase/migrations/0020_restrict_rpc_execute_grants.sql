-- Make the `grant execute ... to authenticated` lines in 0012/0015/0017/0018/0019
-- actually mean what they say.
--
-- Those grants were written as if they restricted the function to signed-in
-- callers. They don't, and never did: Postgres grants EXECUTE on a new function
-- to PUBLIC by default, and Supabase's default privileges additionally grant it
-- to `anon` outright. A `grant ... to authenticated` on top of that is purely
-- additive — it adds nothing and removes nothing. Verified against the live
-- project: an anon client could call inventory_haves_counts() and get rows back.
--
-- Nothing was actually exposed by that, which is why this is hardening and not a
-- patch: every one of these functions is `security invoker`, so it runs as the
-- caller and RLS still decides what comes back. find_trade_matches() returns 0
-- rows to anon (auth.uid() is null), confirm_trade_completion() can't even see
-- the trade row to lock it, and inventory_haves_counts() only aggregates
-- inventory_items, which is already world-readable via the `using (true)` policy
-- from 0009. (If *that* is the surprise — an anon caller can enumerate every
-- user's inventory straight from the table — the fix belongs in that policy, not
-- here. This migration deliberately does not change it.)
--
-- What this buys is defence in depth: these four functions become unreachable
-- without a session, so a future edit that loosens an RLS policy, or a new
-- function body that stops checking auth.uid(), can't quietly become anonymously
-- callable as well.
--
-- Deliberately NOT touched: cards_distinct_teams()/cards_distinct_set_names()
-- (0006), which grant `anon, authenticated` on purpose — the card catalog's
-- filter facets are public data.

-- Revoke from both PUBLIC (the Postgres default) and `anon` explicitly (the
-- Supabase default privilege). Revoking from PUBLIC alone would leave a direct
-- grant to `anon` in place.
revoke execute on function public.find_trade_matches() from public, anon;
revoke execute on function public.inventory_haves_counts() from public, anon;
revoke execute on function public.confirm_trade_completion(uuid) from public, anon;
revoke execute on function public.match_cards_by_text(text, text, text, int) from public, anon;

-- Re-assert the intended grant *after* the revokes. `authenticated` holds its own
-- explicit grant and so is untouched by a revoke from public/anon — but stating
-- it again makes this migration idempotent and, more importantly, means a
-- mistake in the revokes above can only ever fail closed for anon, never lock
-- out the signed-in users the app actually depends on.
grant execute on function public.find_trade_matches() to authenticated;
grant execute on function public.inventory_haves_counts() to authenticated;
grant execute on function public.confirm_trade_completion(uuid) to authenticated;
grant execute on function public.match_cards_by_text(text, text, text, int) to authenticated;
