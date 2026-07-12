"use client";

import { StatStrip } from "@/components/shared/StatStrip";
import { LevelProgress } from "@/components/profile/LevelProgress";
import { useInventory } from "@/lib/queries/inventory";
import { useMyCompletedTradesCount } from "@/lib/queries/trades";

// Level + stats only. The badge grid and account rows are composed by
// app/(main)/profile/page.tsx, which sits them side-by-side on wide screens —
// they can't live here because the account rows are server-rendered.
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
    </div>
  );
}
