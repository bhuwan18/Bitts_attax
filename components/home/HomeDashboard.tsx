"use client";

import { StatStrip } from "@/components/shared/StatStrip";
import { StreakBanner } from "@/components/home/StreakBanner";
import { RecentCardsRail } from "@/components/home/RecentCardsRail";
import { TradeMatchesWidget } from "@/components/home/TradeMatchesWidget";
import { AchievementsPreview } from "@/components/home/AchievementsPreview";
import { TradersSpotlight } from "@/components/home/TradersSpotlight";
import { useInventory, useWantList } from "@/lib/queries/inventory";
import { useTradeMatches } from "@/lib/queries/matches";

export function HomeDashboard() {
  const { data: inventory } = useInventory();
  const { data: wantList } = useWantList();
  const { data: matches } = useTradeMatches();

  return (
    <div className="flex flex-col gap-7 p-4 sm:p-6">
      <StatStrip
        size="lg"
        items={[
          { label: "Unique cards", value: inventory?.length ?? 0, accent: "text-primary" },
          { label: "On wishlist", value: wantList?.length ?? 0, accent: "text-warning" },
          { label: "Trade matches", value: matches?.length ?? 0, accent: "text-brand" },
        ]}
      />
      <StreakBanner />
      <TradeMatchesWidget />
      <RecentCardsRail />
      <AchievementsPreview />
      <TradersSpotlight />
    </div>
  );
}
