"use client";

import { Handshake, Gem, Flame, Repeat, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAchievements, useUnlockedAchievements } from "@/lib/queries/gamification";

// Icon choice is a presentation concern, resolved here rather than persisted
// as data on the achievements table (which would just have to stay in sync
// with this file anyway).
const ACHIEVEMENT_ICON: Record<string, LucideIcon> = {
  first_trade: Handshake,
  rare_hunter: Gem,
  streak_5: Flame,
  trader_x3: Repeat,
};

export function AchievementBadgeGrid() {
  const { data: achievements } = useAchievements();
  const { data: unlocked } = useUnlockedAchievements();

  if (!achievements || achievements.length === 0) return null;

  const unlockedIds = new Set((unlocked ?? []).map((row) => row.achievement_id));

  return (
    <div>
      <h2 className="mb-3 font-heading text-lg font-bold">Badges</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {achievements.map((achievement) => {
          const Icon = ACHIEVEMENT_ICON[achievement.id] ?? Gem;
          const isUnlocked = unlockedIds.has(achievement.id);
          return (
            <div
              key={achievement.id}
              className={cn(
                "flex flex-col gap-2 rounded-2xl bg-card p-3",
                !isUnlocked && "opacity-35"
              )}
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="size-[18px]" />
              </span>
              <div>
                <p className="text-sm font-semibold">{achievement.name}</p>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
