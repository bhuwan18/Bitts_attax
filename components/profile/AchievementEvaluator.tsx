"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/queries/auth";
import { useAchievements } from "@/lib/queries/gamification";
import { evaluateAchievements } from "@/app/(main)/gamification/actions";
import { CelebrationBurst } from "@/components/gamification/CelebrationBurst";

// A safety net that evaluates achievement unlocks once per Profile page
// visit, for criteria satisfied outside the 3 explicit action trigger points
// (e.g. an admin/manual data fix). Renders only the celebration burst — the
// toast is the only other visible output, and that's imperative (sonner).
export function AchievementEvaluator() {
  const { data: user } = useCurrentUser();
  const { data: achievements } = useAchievements();
  const queryClient = useQueryClient();
  const evaluatedForUserId = useRef<string | null>(null);
  const [burstTrigger, setBurstTrigger] = useState(0);

  useEffect(() => {
    if (!user?.id || evaluatedForUserId.current === user.id) return;
    evaluatedForUserId.current = user.id;

    evaluateAchievements()
      .then((newlyUnlockedIds) => {
        if (newlyUnlockedIds.length === 0) return;
        queryClient.invalidateQueries({ queryKey: ["unlockedAchievements"] });
        setBurstTrigger(Date.now());
        for (const id of newlyUnlockedIds) {
          const name = achievements?.find((a) => a.id === id)?.name ?? "Achievement";
          toast.success(`Unlocked: ${name}`);
        }
      })
      .catch(() => {
        evaluatedForUserId.current = null;
      });
  }, [user?.id, achievements, queryClient]);

  return <CelebrationBurst key={burstTrigger} trigger={burstTrigger} />;
}
