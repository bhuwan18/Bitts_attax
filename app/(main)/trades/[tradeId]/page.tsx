"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FairnessMeter } from "@/components/trades/FairnessMeter";
import { useTrade } from "@/lib/queries/trades";
import { useCurrentUser } from "@/lib/queries/auth";
import { computeAndPersistFairness } from "./fairness-actions";
import { updateTradeStatus } from "@/app/(main)/trades/actions";
import type { FairnessResult } from "@/lib/fairness";

export default function TradeDetailPage({ params }: { params: Promise<{ tradeId: string }> }) {
  const { tradeId } = use(params);
  const { data: trade, isLoading, refetch } = useTrade(tradeId);
  const { data: currentUser } = useCurrentUser();
  const [computedFairness, setComputedFairness] = useState<FairnessResult | null>(null);
  const [updating, setUpdating] = useState(false);

  const persistedFairness = trade?.fairness_breakdown as unknown as FairnessResult | null;
  const fairness = persistedFairness ?? computedFairness;

  useEffect(() => {
    if (!trade || trade.fairness_breakdown) return;
    computeAndPersistFairness(tradeId)
      .then(setComputedFairness)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to score trade."));
  }, [trade, tradeId]);

  if (isLoading || !trade) {
    return <p className="p-4 text-sm text-muted-foreground">Loading trade…</p>;
  }

  const myGive = trade.items.filter((i) => i.offered_by === trade.initiator_id);
  const myGet = trade.items.filter((i) => i.offered_by === trade.counterparty_id);
  const isCounterparty = currentUser?.id === trade.counterparty_id;
  const canRespond = isCounterparty && trade.status === "proposed";

  async function respond(status: "accepted" | "rejected") {
    setUpdating(true);
    try {
      await updateTradeStatus(tradeId, status);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update trade.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trade</h1>
        <Badge variant="outline">{trade.status}</Badge>
      </div>

      {fairness && <FairnessMeter result={fairness} />}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {trade.initiator?.display_name ?? trade.initiator?.username} gives
          </p>
          <div className="flex flex-col gap-1">
            {myGive.map((i) => (
              <Badge key={i.card.id} variant="secondary" className="w-fit">
                {i.card.name} ×{i.quantity}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {trade.counterparty?.display_name ?? trade.counterparty?.username} gives
          </p>
          <div className="flex flex-col gap-1">
            {myGet.map((i) => (
              <Badge key={i.card.id} variant="secondary" className="w-fit">
                {i.card.name} ×{i.quantity}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {canRespond && (
        <div className="flex gap-2">
          <Button disabled={updating} onClick={() => respond("accepted")}>
            Accept
          </Button>
          <Button disabled={updating} variant="outline" onClick={() => respond("rejected")}>
            Decline
          </Button>
        </div>
      )}

      <Button variant="secondary" render={<Link href={`/trades/${tradeId}/chat`} />}>
        Open chat
      </Button>
    </div>
  );
}
