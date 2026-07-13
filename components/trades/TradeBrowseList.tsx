"use client";

import { Repeat } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/queries/auth";
import { useTradeListings } from "@/lib/queries/trades";
import { TradeListingCard } from "@/components/trades/TradeListingCard";

function TradeBrowseSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-border">
          <Skeleton className="h-5 w-2/3" />
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-5 w-full rounded-full" />
            </div>
            <Skeleton className="mt-4 size-4 shrink-0 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-full rounded-full" />
            </div>
          </div>
          <Skeleton className="mt-1 h-8 w-32 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function TradeBrowseList() {
  // Read from the client rather than taking a `currentUserId` prop — the prop
  // is what forced app/(main)/trades/page.tsx to be a dynamic Server Component.
  const { data: user } = useCurrentUser();
  const { data: listings, isLoading } = useTradeListings();

  if (isLoading) return <TradeBrowseSkeleton />;

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
    // Two columns from tablet up — a single centred column of listings leaves
    // half a landscape iPad empty. `items-start` keeps cards their natural
    // height instead of stretching short ones to match tall neighbours.
    <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
      {listings.map((listing, i) => (
        <div
          key={listing.id}
          style={{ animationDelay: `${(i % 10) * 35}ms` }}
          className="animate-in fade-in-0 slide-in-from-bottom-4 fill-mode-both animation-duration-400"
        >
          <TradeListingCard listing={listing} currentUserId={user?.id ?? null} />
        </div>
      ))}
    </div>
  );
}
