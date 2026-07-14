"use client";

import { use, useEffect, useState } from "react";
import { MessageCircle, Check, X, CheckCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { FairnessMeter } from "@/components/trades/FairnessMeter";
import { RarityBadge } from "@/components/cards/RarityBadge";
import { CardThumb } from "@/components/cards/CardThumb";
import { useTrade, getInsufficientTradeItems, type TradeWithDetails } from "@/lib/queries/trades";
import { useCurrentUser } from "@/lib/queries/auth";
import { computeAndPersistFairness } from "./fairness-actions";
import { updateTradeStatus, confirmTradeCompletion } from "@/app/(main)/trades/actions";
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
  const isInitiator = currentUser?.id === trade.initiator_id;
  const isCounterparty = currentUser?.id === trade.counterparty_id;
  const canRespond = isCounterparty && trade.status === "proposed";

  const myCompletedAt = isInitiator ? trade.initiator_completed_at : trade.counterparty_completed_at;
  const theirCompletedAt = isInitiator ? trade.counterparty_completed_at : trade.initiator_completed_at;
  const otherParty = isInitiator ? trade.counterparty : trade.initiator;
  const otherPartyName = otherParty?.display_name ?? otherParty?.username ?? "the other trader";
  const canConfirmCompletion = trade.status === "accepted" && !myCompletedAt;
  const awaitingTheirConfirmation = trade.status === "accepted" && !!myCompletedAt && !theirCompletedAt;
  const insufficientItems = getInsufficientTradeItems(trade);

  function nameFor(userId: string) {
    const profile = userId === trade!.initiator_id ? trade!.initiator : trade!.counterparty;
    return profile?.display_name ?? profile?.username ?? "This trader";
  }

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

  async function confirmCompletion() {
    setUpdating(true);
    try {
      await confirmTradeCompletion(tradeId);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to confirm completion.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl tracking-tight">Trade</h1>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 font-sans text-xs font-extrabold tracking-wide uppercase",
            TRADE_STATUS_STYLE[trade.status] ?? "bg-muted text-muted-foreground"
          )}
        >
          {trade.status}
        </span>
      </div>

      {insufficientItems.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <div className="flex flex-col gap-1 text-sm">
            <p className="font-medium text-warning">Some offered cards may no longer be available</p>
            {insufficientItems.map((item) => (
              <p key={item.card.id} className="text-muted-foreground">
                {nameFor(item.offered_by)} now has {item.availableQuantity} of {item.card.name}
                {item.card.set_name && ` (${item.card.set_name})`}, but{" "}
                {item.quantity} {item.quantity === 1 ? "was" : "were"} offered.
              </p>
            ))}
          </div>
        </div>
      )}

      {fairness && (
        <FairnessMeter
          result={fairness}
          sideALabel={trade.initiator?.display_name ?? trade.initiator?.username ?? "Side A"}
          sideBLabel={trade.counterparty?.display_name ?? trade.counterparty?.username ?? "Side B"}
        />
      )}

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

      {canConfirmCompletion && (
        <Button disabled={updating} onClick={confirmCompletion} className="w-full">
          <CheckCheck className="size-4" />
          Mark as complete
        </Button>
      )}

      {awaitingTheirConfirmation && (
        <p className="text-center text-sm text-muted-foreground">
          Waiting for {otherPartyName} to confirm the trade is complete…
        </p>
      )}

      <section
        id="chat"
        className="flex h-[28rem] max-h-[65vh] min-h-0 scroll-mt-4 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-border"
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <MessageCircle className="size-4 text-muted-foreground" />
          <h2 className="font-sans text-sm font-extrabold tracking-wide uppercase">Chat</h2>
        </div>
        <ChatInterface tradeId={tradeId} />
      </section>
    </div>
  );
}

function TradeSide({
  label,
  items,
}: {
  label: string;
  items: TradeWithDetails["items"];
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-3 ring-1 ring-border">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((i) => (
          <div key={i.card.id} className="flex items-center gap-2">
            <CardThumb name={i.card.name} imageUrl={i.card.image_url} rarity={i.card.rarity} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">
                {i.card.name}
                {i.quantity > 1 && <span className="text-muted-foreground"> ×{i.quantity}</span>}
              </span>
              <div className="flex items-center gap-1.5">
                <RarityBadge rarity={i.card.rarity} />
                {i.card.set_name && (
                  <span className="truncate text-[11px] text-muted-foreground/70">
                    {i.card.set_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
