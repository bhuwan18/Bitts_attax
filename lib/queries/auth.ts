"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";

// Nearly every other query in the app is gated on `enabled: !!user`, so this one
// query is the neck of a two-wave waterfall: nothing else can even start until it
// resolves. That makes *how* it resolves worth caring about.
//
// getSession() reads the session straight from the cookie the browser already
// has (only hitting the network on the rarer path where the access token has
// expired and needs refreshing), whereas getUser() always makes a round-trip to
// /auth/v1/user to re-validate it. Using getSession() here typically removes an
// entire serial network hop from every cold page load.
//
// It is *not* a weaker check in this context, despite Supabase's warning about
// getSession(): that warning is about trusting an unverified JWT **on the
// server**, where the cookie is attacker-supplied input. Here the only consumer
// is the user's own browser, and everything this value feeds is either UI-only
// (a display name, an `enabled` flag) or a query filter — and those queries are
// still executed against RLS with the real JWT, which PostgREST verifies
// server-side. A forged local session buys nothing: it would just produce
// queries that return nothing. Genuine authorisation is enforced by proxy.ts and
// RLS, both of which do verify (see the Server Action convention in CLAUDE.md —
// actions re-derive identity via getUser() and never trust the client).
export function useCurrentUser() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    });
    return () => subscription.subscription.unsubscribe();
  }, [supabase, queryClient]);

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.user ?? null;
    },
    // The session only changes via onAuthStateChange, which already invalidates
    // this key — so re-reading it on every mount is pure overhead.
    staleTime: Infinity,
  });
}

// Fetches the caller's own `profiles` row for UI-only gating (e.g. showing the
// Admin nav link). Not a security boundary by itself — the admin route's
// server-side layout guard and RLS are what actually enforce access.
export function useCurrentProfile() {
  const supabase = useSupabase();
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["currentProfile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, role")
        .eq("id", user!.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
