"use client";

import { StatStrip } from "@/components/shared/StatStrip";
import { LevelProgress } from "@/components/profile/LevelProgress";
import { AchievementBadgeGrid } from "@/components/profile/AchievementBadgeGrid";
import { AchievementEvaluator } from "@/components/profile/AchievementEvaluator";
import { useInventory } from "@/lib/queries/inventory";
import { useMyCompletedTradesCount } from "@/lib/queries/trades";

export function ProfileDashboard() {
  const { data: inventory } = useInventory();
  const { data: tradesCompleted } = useMyCompletedTradesCount();

  const uniqueCards = inventory?.length ?? 0;
  const totalCards = inventory?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <LevelProgress uniqueCardsOwned={uniqueCards} />
      <StatStrip
        size="lg"
        items={[
          { label: "Total cards", value: totalCards, accent: "text-primary" },
          { label: "Unique", value: uniqueCards, accent: "text-warning" },
          { label: "Trades done", value: tradesCompleted ?? 0, accent: "text-brand" },
        ]}
      />
      <AchievementBadgeGrid />
      <AchievementEvaluator />
    </div>
  );
}
