"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useCurrentUser } from "@/lib/queries/auth";
import type { Card, Profile } from "@/lib/types/database.types";

export interface TraderInventoryItem {
  id: string;
  quantity: number;
  custom_image_url: string | null;
  card: Card;
}

// Every profile except the caller's own, optionally filtered by username/display
// name. `profiles` select RLS is public, so this works for any signed-in caller.
export function useTraders(search?: string) {
  const supabase = useSupabase();
  const { data: currentUser } = useCurrentUser();

  return useQuery({
    queryKey: ["traders", search, currentUser?.id],
    queryFn: async (): Promise<Profile[]> => {
      let query = supabase.from("profiles").select("*").order("username", { ascending: true });

      if (currentUser?.id) {
        query = query.neq("id", currentUser.id);
      }
      if (search) {
        query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentUser,
  });
}

// One lightweight query for the whole browse list's Haves counts, rather than
// one query per trader — `inventory_items` select is public (see below), so
// this returns every user's row count in a single round trip.
export function useTraderHavesCounts() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["traderHavesCounts"],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase.from("inventory_items").select("user_id");
      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.user_id] = (counts[row.user_id] ?? 0) + 1;
      }
      return counts;
    },
  });
}

export function useTraderProfile(userId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["trader", userId],
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// Relies on the public select policy added in
// supabase/migrations/0009_user_discovery_and_notifications.sql — inventory_items
// is readable by any signed-in user, not just its owner, so a trader's Haves can
// be shown on their public profile.
export function useTraderInventory(userId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["traderInventory", userId],
    queryFn: async (): Promise<TraderInventoryItem[]> => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, quantity, custom_image_url, card:cards(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TraderInventoryItem[];
    },
    enabled: !!userId,
  });
}
