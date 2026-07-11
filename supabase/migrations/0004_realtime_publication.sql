-- Adds `messages` to the Supabase Realtime publication so clients can
-- subscribe to Postgres Changes for the channel-per-trade chat pattern.
-- RLS still applies to what a subscribed client actually receives.
alter publication supabase_realtime add table public.messages;
