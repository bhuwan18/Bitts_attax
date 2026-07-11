"use client";

import { Repeat } from "lucide-react";
import { useTradeListings } from "@/lib/queries/trades";
import { TradeListingCard } from "@/components/trades/TradeListingCard";

export function TradeBrowseList({ currentUserId }: { currentUserId: string | null }) {
  const { data: listings, isLoading } = useTradeListings();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading listings…</p>;

  if (!listings || listings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/60 py-14 text-center">
        <Repeat className="size-7 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">
          No open listings yet. Create one to get started.
        </p>
      </div>
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
