"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ACHIEVEMENT_ICON, DEFAULT_ACHIEVEMENT_ICON } from "@/lib/gamification/badgeIcons";
import { useAchievements, useUnlockedAchievements } from "@/lib/queries/gamification";

export function AchievementsPreview() {
  const { data: achievements } = useAchievements();
  const { data: unlocked } = useUnlockedAchievements();

  if (!achievements || achievements.length === 0) return null;

  const unlockedIds = new Set((unlocked ?? []).map((row) => row.achievement_id));

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-heading text-lg">Badges</h2>
        <Link href="/profile" className="text-sm text-primary">
          See all
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {achievements.map((achievement, i) => {
          const Icon = ACHIEVEMENT_ICON[achievement.id] ?? DEFAULT_ACHIEVEMENT_ICON;
          const isUnlocked = unlockedIds.has(achievement.id);
          return (
            <div
              key={achievement.id}
              title={`${achievement.name} — ${achievement.description}`}
              style={{ animationDelay: `${i * 40}ms` }}
              className={cn(
                "animate-in fade-in-0 zoom-in-95 fill-mode-both animation-duration-400 flex flex-col items-center gap-1.5 rounded-2xl bg-card py-3 transition-transform duration-300 ease-[var(--ease-out-quint)]",
                isUnlocked ? "hover:-translate-y-1" : "opacity-35"
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl",
                  isUnlocked ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
                )}
              >
                <Icon className="size-[18px]" />
              </span>
              <span className="truncate px-1 text-[10px] font-extrabold text-muted-foreground">
                {achievement.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
