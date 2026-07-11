"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {listing.title || `${listing.owner?.display_name ?? listing.owner?.username}'s listing`}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Offering</p>
          <div className="flex flex-wrap gap-1">
            {haves.map((i) => (
              <Badge key={i.card.id} variant="outline">
                {i.card.name} ×{i.quantity}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Looking for</p>
          <div className="flex flex-wrap gap-1">
            {wants.map((i) => (
              <Badge key={i.card.id} variant="outline">
                {i.card.name} ×{i.quantity}
              </Badge>
            ))}
          </div>
        </div>
        {!isOwnListing && (
          <Button size="sm" disabled={proposing} onClick={handlePropose}>
            {proposing ? "Proposing…" : "Propose Trade"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
