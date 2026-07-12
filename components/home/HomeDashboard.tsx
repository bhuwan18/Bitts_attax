"use client";

import { StatStrip } from "@/components/shared/StatStrip";
import { StreakBanner } from "@/components/home/StreakBanner";
import { RecentCardsRail } from "@/components/home/RecentCardsRail";
import { TradeMatchesWidget } from "@/components/home/TradeMatchesWidget";
import { useInventory, useWantList } from "@/lib/queries/inventory";
import { useTradeMatches } from "@/lib/queries/matches";

export function HomeDashboard() {
  const { data: inventory } = useInventory();
  const { data: wantList } = useWantList();
  const { data: matches } = useTradeMatches();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <StatStrip
        items={[
          { label: "Unique cards", value: inventory?.length ?? 0 },
          { label: "On wishlist", value: wantList?.length ?? 0 },
          { label: "Trade matches", value: matches?.length ?? 0 },
        ]}
      />
      <StreakBanner />
      <TradeMatchesWidget />
      <RecentCardsRail />
    </div>
  );
}
