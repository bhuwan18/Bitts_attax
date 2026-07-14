"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCheck,
  ChevronRight,
  MessageCircle,
  Repeat,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RarityBadge } from "@/components/cards/RarityBadge";
import { CardThumb } from "@/components/cards/CardThumb";
import { useCurrentUser } from "@/lib/queries/auth";
import { useMyTrades, getInsufficientTradeItems, type TradeWithDetails } from "@/lib/queries/trades";
import { updateTradeStatus, confirmTradeCompletion } from "@/app/(main)/trades/actions";
import { TRADE_STATUS_STYLE } from "@/lib/trades/status";

// A trade you can still act on, or that's waiting on someone. Everything else
// ("completed", plus the "rejected"/"cancelled" archive) is history.
const ACTIVE_STATUSES = new Set(["proposed", "accepted"]);

function MyTradesSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        // Mirrors TradeRow's layout below (meta line, name, give/arrow/get,
        // one left-aligned action) so nothing jumps when the real rows land.
        <div key={i} className="flex flex-col gap-3.5 rounded-xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
            {Array.from({ length: 2 }).map((_, col) => (
              <div key={col} className={cn("flex flex-col gap-1.5", col === 1 && "col-start-3")}>
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
          <Skeleton className="h-8 w-20 rounded-md" />
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
  const [showClosed, setShowClosed] = useState(false);

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

  // Only these two are still live — a trade you can still act on, or that's
  // waiting on someone. Everything else is history.
  const activeTrades = trades.filter((t) => ACTIVE_STATUSES.has(t.status));
  const completedTrades = trades.filter((t) => t.status === "completed");
  // Deliberately "everything that isn't active or completed" rather than an
  // explicit rejected/cancelled list: if a status is ever added to the check
  // constraint on trades.status, it lands here instead of silently vanishing
  // from the screen — which is what the old `!== "completed"` filter would
  // have done to it, just at the other end.
  const closedTrades = trades.filter(
    (t) => !ACTIVE_STATUSES.has(t.status) && t.status !== "completed"
  );

  return (
    <div className="flex flex-col gap-6">
      {activeTrades.length > 0 ? (
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
      ) : (
        // Reachable now in a way it wasn't before: with rejected and cancelled
        // trades filed away, a user whose trades are all dead would otherwise
        // land on a blank space above the archive.
        <p className="rounded-xl bg-muted/60 py-10 text-center text-sm text-muted-foreground">
          No active trades right now.
        </p>
      )}

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

      {closedTrades.length > 0 && (
        <div className="flex flex-col gap-3">
          {/* Collapsed by default. These are dead trades — kept reachable
              (the chat history is often the reason you'd go looking) but not
              worth the scroll on a phone, which is where the duplicates this
              archive is about to inherit would otherwise pile up. */}
          <button
            type="button"
            onClick={() => setShowClosed((open) => !open)}
            aria-expanded={showClosed}
            className="flex w-fit items-center gap-1.5 rounded-md text-[11px] font-medium tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform duration-200 ease-[var(--ease-out-quint)]",
                showClosed && "rotate-90"
              )}
            />
            Closed · {closedTrades.length}
          </button>
          {showClosed &&
            closedTrades.map((trade) => (
              <TradeRow
                key={trade.id}
                trade={trade}
                currentUserId={currentUserId}
                pending={false}
                dimmed
              />
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
  dimmed,
  onCancel,
  onConfirmCompletion,
}: {
  trade: TradeWithDetails;
  currentUserId: string | null;
  pending: boolean;
  // Archived rows sit back until you point at them — they're history, and
  // shouldn't compete with the live trades above for attention.
  dimmed?: boolean;
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
    <div
      className={cn(
        "group relative flex flex-col gap-3.5 rounded-xl bg-card p-4 ring-1 ring-border transition-[transform,box-shadow,opacity] duration-300 ease-[var(--ease-out-quint)] hover:ring-foreground/20 motion-safe:hover:-translate-y-0.5",
        dimmed && "opacity-65 hover:opacity-100"
      )}
    >
      {/* The tile *is* the link — a stretched overlay rather than a "View trade"
          button, so the whole card is one big tap target (this is a one-handed
          phone app). It stays a real <a>, so keyboard focus and open-in-new-tab
          still work; the secondary actions below sit above it on the z-axis and
          keep their own clicks. Its own focus ring doubles as the card's,
          since inset-0 + the same radius traces the card exactly. */}
      <Link
        href={`/trades/${trade.id}`}
        aria-label={`Open trade with ${counterpartyName}`}
        className="absolute inset-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {isInitiator ? "You proposed to" : "Proposed by"}
            <span className="text-muted-foreground/50"> · </span>
            {new Date(trade.created_at).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          {/* Bungee earns its keep on the name alone. The old heading ran the
              whole "Proposed by <name>" sentence through it, which is display
              type doing body-copy work — loud, and it flattened the hierarchy
              because the label and the name carried identical weight. */}
          <p className="truncate font-heading text-lg leading-tight">{counterpartyName}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-sans text-xs font-extrabold tracking-wide uppercase",
              TRADE_STATUS_STYLE[trade.status] ?? "bg-muted text-muted-foreground"
            )}
          >
            {trade.status}
          </span>
          {/* The only affordance left saying "this opens" now the button's gone. */}
          <ChevronRight className="size-4 text-muted-foreground/50 transition-[transform,color] duration-300 ease-[var(--ease-out-quint)] group-hover:text-foreground motion-safe:group-hover:translate-x-0.5" />
        </div>
      </div>

      {hasInsufficientItems && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>Stock changed — some offered cards may no longer be available.</span>
        </div>
      )}

      {/* Same give/get/arrow skeleton as TradeListingCard, so a trade reads the
          same way whether you're browsing it or already in it. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <ItemGroup label="You give" items={myItems} />
        <ArrowLeftRight className="mt-5 size-4 shrink-0 text-muted-foreground/60" />
        <ItemGroup label="You get" items={theirItems} />
      </div>

      {awaitingTheirConfirmation && (
        <p className="text-xs text-muted-foreground">Waiting for {counterpartyName} to confirm…</p>
      )}

      {/* Positioned so it stacks above the stretched link — without this the
          overlay would swallow these clicks. */}
      <div className="relative z-10 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          render={<Link href={`/trades/${trade.id}#chat`} />}
          className="text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="size-4" />
          Chat
        </Button>
        {/* Destructive and confirming actions push right, away from Chat — they
            shouldn't sit under the thumb by accident on the way to the tile. */}
        {canCancel && (
          <Button size="sm" variant="outline" disabled={pending} onClick={onCancel} className="ml-auto">
            <X className="size-4" />
            Cancel
          </Button>
        )}
        {canConfirmCompletion && (
          <Button
            size="sm"
            disabled={pending}
            onClick={onConfirmCompletion}
            className={cn(!canCancel && "ml-auto")}
          >
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
