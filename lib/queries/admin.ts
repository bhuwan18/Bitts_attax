"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import type { Card, Profile, Trade } from "@/lib/types/database.types";

type ProfileSummary = Pick<Profile, "id" | "username" | "display_name">;

export interface AdminTradeSummary extends Trade {
  initiator: ProfileSummary | null;
  counterparty: ProfileSummary | null;
}

export interface AdminInventoryItem {
  id: string;
  quantity: number;
  condition: string | null;
  card: Card;
}

export interface AdminWantItem {
  id: string;
  priority: number;
  card: Card;
}

const TRADE_SELECT =
  "*, initiator:profiles!trades_initiator_id_fkey(id, username, display_name), counterparty:profiles!trades_counterparty_id_fkey(id, username, display_name)";

// Relies on the admin-only select policies added in
// supabase/migrations/0007_admin_role.sql; RLS returns an empty result for
// non-admin callers rather than an error, so these hooks are safe to call
// from any signed-in session — the /admin route's layout guard is what
// actually keeps non-admins off this page.
export function useAdminUsers() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminRecentTrades(limit = 20) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["admin", "recentTrades", limit],
    queryFn: async (): Promise<AdminTradeSummary[]> => {
      const { data, error } = await supabase
        .from("trades")
        .select(TRADE_SELECT)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as AdminTradeSummary[];
    },
  });
}

export interface AdminUserActivity {
  inventory: AdminInventoryItem[];
  wants: AdminWantItem[];
  trades: AdminTradeSummary[];
}

export function useAdminUserActivity(userId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["admin", "userActivity", userId],
    queryFn: async (): Promise<AdminUserActivity> => {
      const [inventoryRes, wantsRes, tradesRes] = await Promise.all([
        supabase
          .from("inventory_items")
          .select("id, quantity, condition, card:cards(*)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("want_items")
          .select("id, priority, card:cards(*)")
          .eq("user_id", userId)
          .order("priority", { ascending: false }),
        supabase
          .from("trades")
          .select(TRADE_SELECT)
          .or(`initiator_id.eq.${userId},counterparty_id.eq.${userId}`)
          .order("created_at", { ascending: false }),
      ]);

      if (inventoryRes.error) throw inventoryRes.error;
      if (wantsRes.error) throw wantsRes.error;
      if (tradesRes.error) throw tradesRes.error;

      return {
        inventory: (inventoryRes.data ?? []) as unknown as AdminInventoryItem[],
        wants: (wantsRes.data ?? []) as unknown as AdminWantItem[],
        trades: (tradesRes.data ?? []) as unknown as AdminTradeSummary[],
      };
    },
    enabled: !!userId,
  });
}
