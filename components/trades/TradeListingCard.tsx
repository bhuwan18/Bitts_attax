"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { proposeTrade } from "@/app/(main)/trades/actions";
import type { TradeListingWithDetails } from "@/lib/queries/trades";

export function TradeListingCard({
  listing,
  currentUserId,
}: {
  listing: TradeListingWithDetails;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [proposing, setProposing] = useState(false);

  const haves = listing.items.filter((i) => i.side === "have");
  const wants = listing.items.filter((i) => i.side === "want");
  const isOwnListing = currentUserId === listing.owner_id;

  async function handlePropose() {
    setProposing(true);
    try {
      const { tradeId } = await proposeTrade({
        listingId: listing.id,
        counterpartyId: listing.owner_id,
        // The proposer receives the listing's "haves" and contributes the
        // listing's "wants" — accepting the listing's terms as posted.
        myItems: wants.map((w) => ({ cardId: w.card.id, quantity: w.quantity })),
        theirItems: haves.map((h) => ({ cardId: h.card.id, quantity: h.quantity })),
      });
      router.push(`/trades/${tradeId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to propose trade.");
    } finally {
      setProposing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-border">
      <p className="font-heading text-base font-bold">
        {listing.title || `${listing.owner?.display_name ?? listing.owner?.username}'s listing`}
      </p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <ItemGroup label="Offering" tone="success" items={haves} />
        <ArrowLeftRight className="mt-4 size-4 shrink-0 text-muted-foreground" />
        <ItemGroup label="Looking for" tone="primary" items={wants} />
      </div>
      {!isOwnListing && (
        <Button size="sm" disabled={proposing} onClick={handlePropose} className="mt-1 w-fit">
          {proposing ? "Proposing…" : "Propose trade"}
        </Button>
      )}
    </div>
  );
}

function ItemGroup({
  label,
  tone,
  items,
}: {
  label: string;
  tone: "success" | "primary";
  items: { card: { id: string; name: string }; quantity: number }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {items.map((i) => (
          <span
            key={i.card.id}
            className={cn(
              "clip-corner-sm px-2 py-0.5 text-xs font-medium",
              tone === "success" ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
            )}
          >
            {i.card.name}
            {i.quantity > 1 && ` ×${i.quantity}`}
          </span>
        ))}
      </div>
    </div>
  );
}
