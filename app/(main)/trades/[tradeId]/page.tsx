"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FairnessMeter } from "@/components/trades/FairnessMeter";
import { useTrade } from "@/lib/queries/trades";
import { useCurrentUser } from "@/lib/queries/auth";
import { computeAndPersistFairness } from "./fairness-actions";
import { updateTradeStatus } from "@/app/(main)/trades/actions";
import { TRADE_STATUS_STYLE } from "@/lib/trades/status";
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
    <div className="mx-auto flex max-w-lg flex-col gap-5 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Trade</h1>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 font-heading text-xs font-bold tracking-wide uppercase",
            TRADE_STATUS_STYLE[trade.status] ?? "bg-muted text-muted-foreground"
          )}
        >
          {trade.status}
        </span>
      </div>

      {fairness && <FairnessMeter result={fairness} />}

      <div className="grid grid-cols-2 gap-3">
        <TradeSide
          label={`${trade.initiator?.display_name ?? trade.initiator?.username} gives`}
          items={myGive}
        />
        <TradeSide
          label={`${trade.counterparty?.display_name ?? trade.counterparty?.username} gives`}
          items={myGet}
        />
      </div>

      {canRespond && (
        <div className="flex gap-2">
          <Button disabled={updating} onClick={() => respond("accepted")} className="flex-1">
            <Check className="size-4" />
            Accept
          </Button>
          <Button
            disabled={updating}
            variant="outline"
            onClick={() => respond("rejected")}
            className="flex-1"
          >
            <X className="size-4" />
            Decline
          </Button>
        </div>
      )}

      <Button variant="secondary" render={<Link href={`/trades/${tradeId}/chat`} />}>
        <MessageCircle className="size-4" />
        Open chat
      </Button>
    </div>
  );
}

function TradeSide({
  label,
  items,
}: {
  label: string;
  items: { card: { id: string; name: string }; quantity: number }[];
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-3 ring-1 ring-border">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="flex flex-col gap-1">
        {items.map((i) => (
          <span key={i.card.id} className="truncate text-sm font-medium">
            {i.card.name}
            {i.quantity > 1 && <span className="text-muted-foreground"> ×{i.quantity}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
