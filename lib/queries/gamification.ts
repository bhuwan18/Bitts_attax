"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useCurrentUser } from "@/lib/queries/auth";
import { computeCurrentStreak } from "@/lib/gamification/streak";
import type { Achievement, UserAchievement } from "@/lib/types/database.types";

// computeCurrentStreak() walks backwards from today and stops at the first gap,
// so it can never read further than the streak is long. Fetching the user's
// entire activity history to feed it was therefore pure waste that grew by a row
// a day, forever. This caps the read at a streak nobody will hit — and if
// someone somehow does, the count saturates here rather than being wrong in a
// way that matters.
const STREAK_LOOKBACK_DAYS = 400;

export function useCurrentStreak() {
  const supabase = useSupabase();
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["activityStreak", user?.id],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("activity_date")
        .eq("user_id", user!.id)
        .order("activity_date", { ascending: false })
        .limit(STREAK_LOOKBACK_DAYS);
      if (error) throw error;

      const today = new Date().toLocaleDateString("en-CA");
      return computeCurrentStreak(
        (data ?? []).map((row) => row.activity_date),
        today
      );
    },
    enabled: !!user,
  });
}

// Public catalog read (RLS: achievements are publicly readable).
export function useAchievements() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["achievements"],
    queryFn: async (): Promise<Achievement[]> => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUnlockedAchievements() {
  const supabase = useSupabase();
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["unlockedAchievements", user?.id],
    queryFn: async (): Promise<UserAchievement[]> => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}
