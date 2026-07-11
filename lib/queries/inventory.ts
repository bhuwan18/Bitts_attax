"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import {
  addToInventory,
  addWantItem,
  removeInventoryItem,
  removeWantItem,
  updateInventoryQuantity,
} from "@/app/(main)/inventory/actions";
import type { Card } from "@/lib/types/database.types";

export interface InventoryItemWithCard {
  id: string;
  quantity: number;
  condition: string | null;
  card: Card;
}

export interface WantItemWithCard {
  id: string;
  priority: number;
  card: Card;
}

export function useInventory() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["inventory"],
    queryFn: async (): Promise<InventoryItemWithCard[]> => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, quantity, condition, card:cards(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as InventoryItemWithCard[];
    },
  });
}

export function useWantList() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["wantList"],
    queryFn: async (): Promise<WantItemWithCard[]> => {
      const { data, error } = await supabase
        .from("want_items")
        .select("id, priority, card:cards(*)")
        .order("priority", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WantItemWithCard[];
    },
  });
}

function useInvalidateInventory() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["wantList"] });
  };
}

export function useAddToInventory() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: ({ cardId, quantity }: { cardId: string; quantity?: number }) =>
      addToInventory(cardId, quantity),
    onSuccess: invalidate,
  });
}

export function useUpdateInventoryQuantity() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateInventoryQuantity(itemId, quantity),
    onSuccess: invalidate,
  });
}

export function useRemoveInventoryItem() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (itemId: string) => removeInventoryItem(itemId),
    onSuccess: invalidate,
  });
}

export function useAddWantItem() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (cardId: string) => addWantItem(cardId),
    onSuccess: invalidate,
  });
}

export function useRemoveWantItem() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (itemId: string) => removeWantItem(itemId),
    onSuccess: invalidate,
  });
}
