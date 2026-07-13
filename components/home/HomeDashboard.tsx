"use client";

import { StatStrip } from "@/components/shared/StatStrip";
import { HeroCta } from "@/components/home/HeroCta";
import { StreakBanner } from "@/components/home/StreakBanner";
import { RecentCardsRail } from "@/components/home/RecentCardsRail";
import { TradeMatchesWidget } from "@/components/home/TradeMatchesWidget";
import { AchievementsPreview } from "@/components/home/AchievementsPreview";
import { TradersSpotlight } from "@/components/home/TradersSpotlight";
import { useInventoryCount, useWantListCount } from "@/lib/queries/inventory";
import { useTradeMatches } from "@/lib/queries/matches";

export function HomeDashboard() {
  // The strip renders three numbers, so it asks for three numbers — it used to
  // fetch the user's whole inventory and want list (full card rows and all) and
  // then call .length on them.
  const { data: inventoryCount } = useInventoryCount();
  const { data: wantListCount } = useWantListCount();
  const { data: matches } = useTradeMatches();

  return (
    <div className="flex flex-col gap-7 p-4 sm:p-6">
      <HeroCta />
      <StatStrip
        size="lg"
        items={[
          { label: "Unique cards", value: inventoryCount ?? 0, accent: "text-primary" },
          { label: "On wishlist", value: wantListCount ?? 0, accent: "text-warning" },
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
