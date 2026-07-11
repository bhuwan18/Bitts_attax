"use client";

import { useTradeListings } from "@/lib/queries/trades";
import { TradeListingCard } from "@/components/trades/TradeListingCard";

export function TradeBrowseList({ currentUserId }: { currentUserId: string | null }) {
  const { data: listings, isLoading } = useTradeListings();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading listings…</p>;

  if (!listings || listings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No open listings yet. Create one to get started.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {listings.map((listing) => (
        <TradeListingCard key={listing.id} listing={listing} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
