"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import {
  CARDS_EFFECTIVE_RELATION,
  CARD_LIST_SELECT,
  cardsInfiniteQueryKey,
  fetchCardsPage,
  getNextCardsPageParam,
  type CardFilters,
  type CardListItem,
} from "@/lib/queries/cardsShared";
import type { Card } from "@/lib/types/database.types";

export type { CardFilters, CardListItem };

const CARD_SEARCH_LIMIT = 100;

// The flat, non-paginated search behind the two card *pickers* (CardPicker,
// HaveWantPicker) — as opposed to useCardsInfinite, which backs the browsable
// /cards catalog.
//
// Returns CardListItem, not Card: a picker renders art, name, team, set, rarity
// and OVR, and that's exactly what CARD_LIST_SELECT fetches. Selecting `*` here
// was pulling every stat column plus the `attributes` JSON blob for up to 100
// rows on every keystroke.
export function useCards(filters: CardFilters = {}, options: { enabled?: boolean } = {}) {
  const supabase = useSupabase();

  return useQuery({
    enabled: options.enabled ?? true,
    queryKey: ["cards", filters],
    queryFn: async (): Promise<CardListItem[]> => {
      let query = supabase
        .from(CARDS_EFFECTIVE_RELATION)
        .select(CARD_LIST_SELECT)
        .order("ovr_rating", { ascending: false });

      if (filters.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }
      if (filters.rarity) {
        query = query.eq("rarity", filters.rarity);
      }
      if (filters.team) {
        query = query.eq("team", filters.team);
      }

      const { data, error } = await query.limit(CARD_SEARCH_LIMIT);
      if (error) throw error;
      return (data ?? []) as CardListItem[];
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
        .from(CARDS_EFFECTIVE_RELATION)
        .select(CARD_LIST_SELECT)
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
      const { data, error } = await supabase
        .from(CARDS_EFFECTIVE_RELATION)
        .select("*")
        .eq("id", cardId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!cardId,
  });
}
