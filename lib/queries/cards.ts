"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import {
  cardsInfiniteQueryKey,
  fetchCardsPage,
  getNextCardsPageParam,
  type CardFilters,
  type CardListItem,
} from "@/lib/queries/cardsShared";
import type { Card } from "@/lib/types/database.types";

export type { CardFilters, CardListItem };

export function useCards(filters: CardFilters = {}, options: { enabled?: boolean } = {}) {
  const supabase = useSupabase();

  return useQuery({
    enabled: options.enabled ?? true,
    queryKey: ["cards", filters],
    queryFn: async (): Promise<Card[]> => {
      let query = supabase.from("cards").select("*").order("ovr_rating", { ascending: false });

      if (filters.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }
      if (filters.rarity) {
        query = query.eq("rarity", filters.rarity);
      }
      if (filters.team) {
        query = query.eq("team", filters.team);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCardsInfinite(filters: CardFilters = {}) {
  const supabase = useSupabase();

  return useInfiniteQuery({
    queryKey: cardsInfiniteQueryKey(filters),
    queryFn: ({ pageParam }) => fetchCardsPage(supabase, filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: getNextCardsPageParam,
  });
}

export function useMostOwnedCards(limit = 10) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["cards", "most-owned", limit],
    queryFn: async (): Promise<CardListItem[]> => {
      const { data, error } = await supabase
        .from("cards")
        .select("id, name, team, rarity, ovr_rating, base_price, image_url")
        .order("owned_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as CardListItem[];
    },
  });
}

export function useCard(cardId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["card", cardId],
    queryFn: async (): Promise<Card | null> => {
      const { data, error } = await supabase.from("cards").select("*").eq("id", cardId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!cardId,
  });
}
