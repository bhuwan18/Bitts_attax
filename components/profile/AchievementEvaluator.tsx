"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/queries/auth";
import { useAchievements } from "@/lib/queries/gamification";
import { evaluateAchievements } from "@/app/(main)/gamification/actions";

// Renders nothing — a safety net that evaluates achievement unlocks once per
// Profile page visit, for criteria satisfied outside the 3 explicit action
// trigger points (e.g. an admin/manual data fix).
export function AchievementEvaluator() {
  const { data: user } = useCurrentUser();
  const { data: achievements } = useAchievements();
  const queryClient = useQueryClient();
  const evaluatedForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || evaluatedForUserId.current === user.id) return;
    evaluatedForUserId.current = user.id;

    evaluateAchievements()
      .then((newlyUnlockedIds) => {
        if (newlyUnlockedIds.length === 0) return;
        queryClient.invalidateQueries({ queryKey: ["unlockedAchievements"] });
        for (const id of newlyUnlockedIds) {
          const name = achievements?.find((a) => a.id === id)?.name ?? "Achievement";
          toast.success(`Unlocked: ${name}`);
        }
      })
      .catch(() => {
        evaluatedForUserId.current = null;
      });
  }, [user?.id, achievements, queryClient]);

  return null;
}
