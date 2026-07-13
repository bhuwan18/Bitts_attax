"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useCurrentUser } from "@/lib/queries/auth";
import {
  CARD_WITH_ESTIMATE_SELECT,
  withEffectiveOvr,
  type CardWithEstimate,
} from "@/lib/queries/cardsShared";
import type { Card, Profile } from "@/lib/types/database.types";

export interface TraderInventoryItem {
  id: string;
  quantity: number;
  custom_image_url: string | null;
  card: Card;
}

export interface TraderWantItem {
  id: string;
  priority: number;
  card: Card;
}

/** Everything the trader list/spotlight rows actually render. */
export type TraderSummary = Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;

const TRADER_SUMMARY_SELECT = "id, username, display_name, avatar_url";

const TRADERS_LIMIT = 100;

// Every profile except the caller's own, optionally filtered by username/display
// name. `profiles` select RLS is public, so this works for any signed-in caller.
export function useTraders(search?: string) {
  const supabase = useSupabase();
  const { data: currentUser } = useCurrentUser();

  return useQuery({
    queryKey: ["traders", search, currentUser?.id],
    queryFn: async (): Promise<TraderSummary[]> => {
      let query = supabase
        .from("profiles")
        // Four columns, not `*`: a trader row is an avatar and two lines of
        // text, and the spotlight on Home renders four of them.
        .select(TRADER_SUMMARY_SELECT)
        .order("username", { ascending: true });

      if (currentUser?.id) {
        query = query.neq("id", currentUser.id);
      }
      if (search) {
        query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(TRADERS_LIMIT);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentUser,
  });
}

// Haves count per trader, for the browse list and the Home spotlight.
//
// The aggregate happens in Postgres (inventory_haves_counts(), 0019), not here.
// This used to `select("user_id")` across the whole inventory_items table and
// count the rows in JS, which shipped the entire table to the client and — worse
// — quietly under-reported once the table passed PostgREST's 1000-row response
// cap. One row per trader now, and correct at any size.
export function useTraderHavesCounts() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["traderHavesCounts"],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase.rpc("inventory_haves_counts");
      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.trader_id] = row.haves_count;
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
        .select(`id, quantity, custom_image_url, card:cards(${CARD_WITH_ESTIMATE_SELECT})`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as Array<
        Omit<TraderInventoryItem, "card"> & { card: CardWithEstimate }
      >).map((item) => ({ ...item, card: withEffectiveOvr(item.card) }));
    },
    enabled: !!userId,
  });
}

// Relies on the public select policy added in
// supabase/migrations/0010_want_items_public_read.sql — lets a viewer see what
// to offer a trader, not just what to request from their Haves.
export function useTraderWantList(userId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["traderWantList", userId],
    queryFn: async (): Promise<TraderWantItem[]> => {
      const { data, error } = await supabase
        .from("want_items")
        .select(`id, priority, card:cards(${CARD_WITH_ESTIMATE_SELECT})`)
        .eq("user_id", userId)
        .order("priority", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as Array<
        Omit<TraderWantItem, "card"> & { card: CardWithEstimate }
      >).map((item) => ({ ...item, card: withEffectiveOvr(item.card) }));
    },
    enabled: !!userId,
  });
}
