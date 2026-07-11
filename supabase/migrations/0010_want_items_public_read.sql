-- Extends user discovery (0009) to a trader's want list too, so a viewer can
-- see what to offer them, not just what to request. Same additive technique
-- as inventory_items' public policy: alongside the existing owner-only policy,
-- not replacing it.

create policy "want items are publicly readable"
  on public.want_items for select
  using (true);
