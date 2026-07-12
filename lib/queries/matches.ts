"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useCurrentUser } from "@/lib/queries/auth";
import type { Profile } from "@/lib/types/database.types";

export interface TradeMatch {
  userId: string;
  theyHaveCount: number;
  mutual: boolean;
  profile: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
}

// Two round trips, not N+1: find_trade_matches() (0012_trade_matches_rpc.sql)
// does the set-intersection work in one query, then a single follow-up
// profiles select resolves display names for whatever it returned.
export function useTradeMatches(limit = 10) {
  const supabase = useSupabase();
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["tradeMatches", user?.id, limit],
    queryFn: async (): Promise<TradeMatch[]> => {
      const { data: matches, error: matchesError } = await supabase.rpc("find_trade_matches");
      if (matchesError) throw matchesError;

      const top = (matches ?? []).slice(0, limit);
      if (top.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in(
          "id",
          top.map((m) => m.other_user_id)
        );
      if (profilesError) throw profilesError;

      const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
      return top.map((m) => ({
        userId: m.other_user_id,
        theyHaveCount: m.they_have_count,
        mutual: m.mutual,
        profile: profileById.get(m.other_user_id) ?? {
          id: m.other_user_id,
          username: "collector",
          display_name: null,
          avatar_url: null,
        },
      }));
    },
    enabled: !!user,
  });
}
