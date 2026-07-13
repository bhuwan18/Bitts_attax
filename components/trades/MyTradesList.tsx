"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, CheckCheck, MessageCircle, Repeat, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RarityBadge } from "@/components/cards/RarityBadge";
import { CardThumb } from "@/components/cards/CardThumb";
import { useCurrentUser } from "@/lib/queries/auth";
import { useMyTrades, getInsufficientTradeItems, type TradeWithDetails } from "@/lib/queries/trades";
import { updateTradeStatus, confirmTradeCompletion } from "@/app/(main)/trades/actions";
import { TRADE_STATUS_STYLE } from "@/lib/trades/status";

function MyTradesSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, col) => (
              <div key={col} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-16" />
                <div className="flex items-center gap-2">
                  <Skeleton className="size-10 shrink-0 rounded-md" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-md" />
            <Skeleton className="h-8 w-10 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MyTradesList() {
  // Read from the client rather than taking a `currentUserId` prop — the prop
  // is what forced app/(main)/trades/page.tsx to be a dynamic Server Component.
  const { data: user } = useCurrentUser();
  const currentUserId = user?.id ?? null;
  const { data: trades, isLoading, refetch } = useMyTrades();
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (isLoading) return <MyTradesSkeleton />;

  if (!trades || trades.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/60 py-14 text-center">
        <Repeat className="size-7 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">
          No trades yet. Propose one from a listing or a trader&apos;s profile.
        </p>
      </div>
    );
  }

  async function handleCancel(tradeId: string) {
    setPendingId(tradeId);
    try {
      await updateTradeStatus(tradeId, "cancelled");
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel trade.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleConfirmCompletion(tradeId: string) {
    setPendingId(tradeId);
    try {
      await confirmTradeCompletion(tradeId);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to confirm completion.");
    } finally {
      setPendingId(null);
    }
  }

  const activeTrades = trades.filter((t) => t.status !== "completed");
  const completedTrades = trades.filter((t) => t.status === "completed");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {activeTrades.map((trade) => (
          <TradeRow
            key={trade.id}
            trade={trade}
            currentUserId={currentUserId}
            pending={pendingId === trade.id}
            onCancel={() => handleCancel(trade.id)}
            onConfirmCompletion={() => handleConfirmCompletion(trade.id)}
          />
        ))}
      </div>

      {completedTrades.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Completed
          </p>
          {completedTrades.map((trade) => (
            <TradeRow key={trade.id} trade={trade} currentUserId={currentUserId} pending={false} />
          ))}
        </div>
      )}
    </div>
  );
}

function TradeRow({
  trade,
  currentUserId,
  pending,
  onCancel,
  onConfirmCompletion,
}: {
  trade: TradeWithDetails;
  currentUserId: string | null;
  pending: boolean;
  onCancel?: () => void;
  onConfirmCompletion?: () => void;
}) {
  const isInitiator = currentUserId === trade.initiator_id;
  const counterpartyProfile = isInitiator ? trade.counterparty : trade.initiator;
  const counterpartyName =
    counterpartyProfile?.display_name ?? counterpartyProfile?.username ?? "Unknown trader";
  const myItems = trade.items.filter((i) => i.offered_by === currentUserId);
  const theirItems = trade.items.filter((i) => i.offered_by !== currentUserId);

  // Only the person who proposed the trade can back out, and only before the
  // counterparty has responded — once it's accepted the deal is struck,
  // mirroring the accept/decline gating on the detail page.
  const canCancel = isInitiator && trade.status === "proposed";

  const myCompletedAt = isInitiator ? trade.initiator_completed_at : trade.counterparty_completed_at;
  const theirCompletedAt = isInitiator ? trade.counterparty_completed_at : trade.initiator_completed_at;
  const canConfirmCompletion = trade.status === "accepted" && !myCompletedAt;
  const awaitingTheirConfirmation = trade.status === "accepted" && !!myCompletedAt && !theirCompletedAt;
  const hasInsufficientItems = getInsufficientTradeItems(trade).length > 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-border">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-heading text-base">
            {isInitiator ? "You proposed to " : "Proposed by "}
            {counterpartyName}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(trade.created_at).toLocaleDateString()}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 font-sans text-xs font-extrabold tracking-wide uppercase",
            TRADE_STATUS_STYLE[trade.status] ?? "bg-muted text-muted-foreground"
          )}
        >
          {trade.status}
        </span>
      </div>

      {hasInsufficientItems && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>Stock changed — some offered cards may no longer be available. See trade for details.</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <ItemGroup label="You give" items={myItems} />
        <ItemGroup label="You get" items={theirItems} />
      </div>

      {awaitingTheirConfirmation && (
        <p className="text-xs text-muted-foreground">Waiting for {counterpartyName} to confirm…</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" render={<Link href={`/trades/${trade.id}`} />} className="flex-1">
          View trade
        </Button>
        <Button size="sm" variant="secondary" render={<Link href={`/trades/${trade.id}/chat`} />}>
          <MessageCircle className="size-4" />
        </Button>
        {canCancel && (
          <Button size="sm" variant="outline" disabled={pending} onClick={onCancel}>
            <X className="size-4" />
            Cancel
          </Button>
        )}
        {canConfirmCompletion && (
          <Button size="sm" disabled={pending} onClick={onConfirmCompletion}>
            <CheckCheck className="size-4" />
            Mark complete
          </Button>
        )}
      </div>
    </div>
  );
}

function ItemGroup({
  label,
  items,
}: {
  label: string;
  items: TradeWithDetails["items"];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
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
