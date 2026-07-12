"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/queries/auth";
import { useAchievements } from "@/lib/queries/gamification";
import { recordDailyActivity } from "@/app/(main)/gamification/actions";
import { CelebrationBurst } from "@/components/gamification/CelebrationBurst";

// Mounted once in app/(main)/layout.tsx (same shape as NotificationsListener)
// to record one activity_log row per calendar day per user, which
// useCurrentStreak() turns into a streak count. Also the app-wide trigger
// point for the celebration burst — a streak-based achievement unlocking on
// the very first screen someone opens that day is a better moment than
// waiting for them to visit Profile.
export function ActivityRecorder() {
  const { data: user } = useCurrentUser();
  const { data: achievements } = useAchievements();
  const queryClient = useQueryClient();
  const recordedForUserId = useRef<string | null>(null);
  const [burstTrigger, setBurstTrigger] = useState(0);

  useEffect(() => {
    if (!user?.id || recordedForUserId.current === user.id) return;
    recordedForUserId.current = user.id;

    const localDate = new Date().toLocaleDateString("en-CA");
    recordDailyActivity(localDate)
      .then((newlyUnlockedIds) => {
        queryClient.invalidateQueries({ queryKey: ["activityStreak"] });
        queryClient.invalidateQueries({ queryKey: ["unlockedAchievements"] });
        if (newlyUnlockedIds.length === 0) return;
        setBurstTrigger(Date.now());
        for (const id of newlyUnlockedIds) {
          const name = achievements?.find((a) => a.id === id)?.name ?? "Achievement";
          toast.success(`Unlocked: ${name}`);
        }
      })
      .catch(() => {
        // Low-stakes cosmetic feature — a failed streak recording shouldn't
        // surface an error to the user, just try again next mount.
        recordedForUserId.current = null;
      });
  }, [user?.id, achievements, queryClient]);

  return <CelebrationBurst key={burstTrigger} trigger={burstTrigger} />;
}
