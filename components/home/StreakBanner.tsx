"use client";

import { Flame } from "lucide-react";
import { useCurrentStreak } from "@/lib/queries/gamification";

export function StreakBanner() {
  const { data: streak } = useCurrentStreak();

  if (!streak) return null;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-warning/30 bg-warning/10 p-4">
      <span className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-warning text-warning-foreground">
        <span className="pulse-glow-warning absolute inset-0 rounded-2xl" aria-hidden="true" />
        <Flame className="relative size-7" strokeWidth={2.5} />
      </span>
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-4xl leading-none text-warning">{streak}</span>
        <p className="text-sm leading-tight">
          <span className="font-extrabold">day streak.</span>{" "}
          <span className="text-muted-foreground">Come back tomorrow to keep it alive.</span>
        </p>
      </div>
    </div>
  );
}
