-- Seeds the default fairness configuration so lib/fairness.ts always has an
-- active row to read, even before any admin tuning UI exists.
insert into public.fairness_rules (key, rarity_weights, ovr_weight, price_weight, tolerance_pct, is_active)
values (
  'default',
  '{
    "common": 1,
    "uncommon": 1.2,
    "rare": 1.5,
    "super_rare": 2,
    "legend": 3,
    "limited": 4,
    "other": 1
  }'::jsonb,
  0.5,
  1.0,
  10.0,
  true
)
on conflict (key) do nothing;
