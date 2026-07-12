"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/queries/auth";
import { recordDailyActivity } from "@/app/(main)/gamification/actions";

// Renders nothing — mounted once in app/(main)/layout.tsx (same shape as
// NotificationsListener) to record one activity_log row per calendar day per
// user, which useCurrentStreak() (lib/queries/gamification.ts) turns into a
// streak count.
export function ActivityRecorder() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const recordedForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || recordedForUserId.current === user.id) return;
    recordedForUserId.current = user.id;

    const localDate = new Date().toLocaleDateString("en-CA");
    recordDailyActivity(localDate)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["activityStreak"] });
        queryClient.invalidateQueries({ queryKey: ["unlockedAchievements"] });
      })
      .catch(() => {
        // Low-stakes cosmetic feature — a failed streak recording shouldn't
        // surface an error to the user, just try again next mount.
        recordedForUserId.current = null;
      });
  }, [user?.id, queryClient]);

  return null;
}
