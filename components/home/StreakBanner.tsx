"use client";

import { Flame } from "lucide-react";
import { useCurrentStreak } from "@/lib/queries/gamification";

export function StreakBanner() {
  const { data: streak } = useCurrentStreak();

  if (!streak) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-warning/25 bg-warning/8 px-4 py-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning text-warning-foreground">
        <Flame className="size-5" strokeWidth={2.5} />
      </span>
      <p className="text-sm leading-tight">
        <span className="font-heading font-bold">{streak}-day streak.</span>{" "}
        <span className="text-muted-foreground">Open the app tomorrow to keep it going.</span>
      </p>
    </div>
  );
}
