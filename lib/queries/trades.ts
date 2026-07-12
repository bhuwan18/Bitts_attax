"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useCurrentUser } from "@/lib/queries/auth";
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
          "*, owner:profiles(id, username, display_name), items:trade_listing_items(side, quantity, card:cards(*))"
        )
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as TradeListingWithDetails[];
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
  items: { offered_by: string; quantity: number; card: Card }[];
}

export function useTrade(tradeId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["trade", tradeId],
    queryFn: async (): Promise<TradeWithDetails> => {
      const { data, error } = await supabase
        .from("trades")
        .select(
          "*, initiator:profiles!trades_initiator_id_fkey(id, username, display_name), counterparty:profiles!trades_counterparty_id_fkey(id, username, display_name), items:trade_items(offered_by, quantity, card:cards(*))"
        )
        .eq("id", tradeId)
        .single();

      if (error) throw error;
      return data as unknown as TradeWithDetails;
    },
    enabled: !!tradeId,
  });
}
