"use client";

import { cn } from "@/lib/utils";
import { ACHIEVEMENT_ICON, DEFAULT_ACHIEVEMENT_ICON } from "@/lib/gamification/badgeIcons";
import { useAchievements, useUnlockedAchievements } from "@/lib/queries/gamification";

export function AchievementBadgeGrid() {
  const { data: achievements } = useAchievements();
  const { data: unlocked } = useUnlockedAchievements();

  if (!achievements || achievements.length === 0) return null;

  const unlockedIds = new Set((unlocked ?? []).map((row) => row.achievement_id));

  return (
    <div>
      <h2 className="mb-3 font-heading text-lg">Badges</h2>
      {/* Deliberately a fixed 2-column grid. A viewport breakpoint (md:grid-cols-4)
          can't see that this grid sits inside a ~430px column on landscape, so it
          would cram four badges to ~107px each and shred the label text. Two
          columns stay comfortable in every context this renders in. */}
      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement, i) => {
          const Icon = ACHIEVEMENT_ICON[achievement.id] ?? DEFAULT_ACHIEVEMENT_ICON;
          const isUnlocked = unlockedIds.has(achievement.id);
          return (
            <div
              key={achievement.id}
              style={{ animationDelay: `${i * 40}ms` }}
              className={cn(
                "animate-in fade-in-0 slide-in-from-bottom-4 fill-mode-both animation-duration-400 flex flex-col gap-2 rounded-2xl bg-card p-3 transition-transform duration-300 ease-[var(--ease-out-quint)]",
                isUnlocked ? "hover:-translate-y-1" : "opacity-35"
              )}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  isUnlocked ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
                )}
              >
                <Icon className="size-5" />
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
