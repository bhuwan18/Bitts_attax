"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import type { Card, Rarity } from "@/lib/types/database.types";

export interface CardFilters {
  search?: string;
  rarity?: Rarity;
  team?: string;
}

export function useCards(filters: CardFilters = {}) {
  const supabase = useSupabase();

  return useQuery({
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
