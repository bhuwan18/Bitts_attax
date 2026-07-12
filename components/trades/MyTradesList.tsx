"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MessageCircle, Repeat, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMyTrades } from "@/lib/queries/trades";
import { updateTradeStatus } from "@/app/(main)/trades/actions";
import { TRADE_STATUS_STYLE } from "@/lib/trades/status";

export function MyTradesList({ currentUserId }: { currentUserId: string | null }) {
  const { data: trades, isLoading, refetch } = useMyTrades();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading your trades…</p>;

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
    setCancellingId(tradeId);
    try {
      await updateTradeStatus(tradeId, "cancelled");
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel trade.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {trades.map((trade) => {
        const isInitiator = currentUserId === trade.initiator_id;
        const counterpartyProfile = isInitiator ? trade.counterparty : trade.initiator;
        const counterpartyName =
          counterpartyProfile?.display_name ?? counterpartyProfile?.username ?? "Unknown trader";
        const myItems = trade.items.filter((i) => i.offered_by === currentUserId);
        const theirItems = trade.items.filter((i) => i.offered_by !== currentUserId);
        // Only the person who proposed the trade can back out, and only
        // before the counterparty has responded — once it's accepted the
        // deal is struck, mirroring the accept/decline gating on the detail page.
        const canCancel = isInitiator && trade.status === "proposed";

        return (
          <div key={trade.id} className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-border">
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

            <div className="grid grid-cols-2 gap-3">
              <ItemGroup label="You give" items={myItems} />
              <ItemGroup label="You get" items={theirItems} />
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="secondary" render={<Link href={`/trades/${trade.id}`} />} className="flex-1">
                View trade
              </Button>
              <Button size="sm" variant="secondary" render={<Link href={`/trades/${trade.id}/chat`} />}>
                <MessageCircle className="size-4" />
              </Button>
              {canCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={cancellingId === trade.id}
                  onClick={() => handleCancel(trade.id)}
                >
                  <X className="size-4" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ItemGroup({
  label,
  items,
}: {
  label: string;
  items: { card: { id: string; name: string }; quantity: number }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
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
