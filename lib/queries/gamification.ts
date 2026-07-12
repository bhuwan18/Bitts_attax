"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useCurrentUser } from "@/lib/queries/auth";
import { computeCurrentStreak } from "@/lib/gamification/streak";
import type { Achievement, UserAchievement } from "@/lib/types/database.types";

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
        .order("activity_date", { ascending: false });
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
