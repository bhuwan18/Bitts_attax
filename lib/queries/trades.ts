"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useCurrentUser } from "@/lib/queries/auth";
import { CARD_WITH_ESTIMATE_SELECT, withEffectiveOvrOnItems } from "@/lib/queries/cardsShared";
import type { Card, Profile, Trade, TradeListing } from "@/lib/types/database.types";

export interface TradeListingWithDetails extends TradeListing {
  owner: Pick<Profile, "id" | "username" | "display_name"> | null;
  items: { side: "have" | "want"; quantity: number; card: Card }[];
}

export function useTradeListings() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["tradeListings"],
    queryFn: async (): Promise<TradeListingWithDetails[]> => {
      const { data, error } = await supabase
        .from("trade_listings")
        .select(
          `*, owner:profiles(id, username, display_name), items:trade_listing_items(side, quantity, card:cards(${CARD_WITH_ESTIMATE_SELECT}))`
        )
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return withEffectiveOvrOnItems((data ?? []) as unknown as TradeListingWithDetails[]);
    },
  });
}

export function useMyCompletedTradesCount() {
  const supabase = useSupabase();
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["myCompletedTradesCount", user?.id],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("trades")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .or(`initiator_id.eq.${user!.id},counterparty_id.eq.${user!.id}`);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });
}

export interface TradeWithDetails extends Trade {
  initiator: Pick<Profile, "id" | "username" | "display_name"> | null;
  counterparty: Pick<Profile, "id" | "username" | "display_name"> | null;
  // availableQuantity is the giver's *current* inventory_items.quantity for
  // this card — not stored, computed at query time (see attachAvailability
  // below) — so an item can end up short of what was offered if the giver
  // edited their Haves after proposing. Only meaningful while the trade is
  // still "proposed"/"accepted"; for closed trades it's set to `quantity` (a
  // "not applicable, don't flag" sentinel rather than 0) since the giver's
  // current inventory no longer has anything to do with a dead or already
  // fully-transferred trade.
  items: { offered_by: string; quantity: number; card: Card; availableQuantity: number }[];
}

// Only these statuses can still be fulfilled — no point flagging a shortfall
// on a trade that's rejected/cancelled (moot) or completed (items already moved).
const OPEN_TRADE_STATUSES = new Set(["proposed", "accepted"]);

// Flags trade_items whose offered_by no longer has enough of that card in
// their inventory_items — e.g. they removed it or lowered its quantity after
// proposing/accepting the trade. inventory_items has a public select policy
// (0009_user_discovery_and_notifications.sql), so a participant's own
// session can read the *other* party's current quantity here.
async function attachAvailability(
  supabase: ReturnType<typeof useSupabase>,
  trades: TradeWithDetails[]
): Promise<TradeWithDetails[]> {
  const pairs = new Set<string>();
  for (const trade of trades) {
    if (!OPEN_TRADE_STATUSES.has(trade.status)) continue;
    for (const item of trade.items) pairs.add(`${item.offered_by}:${item.card.id}`);
  }

  let availability = new Map<string, number>();
  if (pairs.size > 0) {
    const userIds = [...new Set([...pairs].map((p) => p.split(":")[0]))];
    const cardIds = [...new Set([...pairs].map((p) => p.split(":")[1]))];

    const { data, error } = await supabase
      .from("inventory_items")
      .select("user_id, card_id, quantity")
      .in("user_id", userIds)
      .in("card_id", cardIds);
    if (error) throw error;

    availability = new Map((data ?? []).map((row) => [`${row.user_id}:${row.card_id}`, row.quantity]));
  }

  return trades.map((trade) => {
    const isOpen = OPEN_TRADE_STATUSES.has(trade.status);
    return {
      ...trade,
      items: trade.items.map((item) => ({
        ...item,
        availableQuantity: isOpen
          ? (availability.get(`${item.offered_by}:${item.card.id}`) ?? 0)
          : item.quantity,
      })),
    };
  });
}

// Cards this trade is still relying on that the giver no longer has enough
// of. Empty for closed trades (see attachAvailability's sentinel above).
export function getInsufficientTradeItems(trade: TradeWithDetails) {
  return trade.items.filter((item) => item.availableQuantity < item.quantity);
}

export function useTrade(tradeId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["trade", tradeId],
    queryFn: async (): Promise<TradeWithDetails> => {
      const { data, error } = await supabase
        .from("trades")
        .select(
          `*, initiator:profiles!trades_initiator_id_fkey(id, username, display_name), counterparty:profiles!trades_counterparty_id_fkey(id, username, display_name), items:trade_items(offered_by, quantity, card:cards(${CARD_WITH_ESTIMATE_SELECT}))`
        )
        .eq("id", tradeId)
        .single();

      if (error) throw error;
      const [withOvr] = withEffectiveOvrOnItems([data as unknown as TradeWithDetails]);
      const [trade] = await attachAvailability(supabase, [withOvr]);
      return trade;
    },
    enabled: !!tradeId,
  });
}

export function useMyTrades() {
  const supabase = useSupabase();
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["myTrades", user?.id],
    queryFn: async (): Promise<TradeWithDetails[]> => {
      const { data, error } = await supabase
        .from("trades")
        .select(
          `*, initiator:profiles!trades_initiator_id_fkey(id, username, display_name), counterparty:profiles!trades_counterparty_id_fkey(id, username, display_name), items:trade_items(offered_by, quantity, card:cards(${CARD_WITH_ESTIMATE_SELECT}))`
        )
        .or(`initiator_id.eq.${user!.id},counterparty_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return attachAvailability(
        supabase,
        withEffectiveOvrOnItems((data ?? []) as unknown as TradeWithDetails[])
      );
    },
    enabled: !!user,
  });
}
