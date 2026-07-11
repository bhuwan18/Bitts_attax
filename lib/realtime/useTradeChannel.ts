"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import type { Message } from "@/lib/types/database.types";
import type { MessageWithSender } from "@/lib/queries/messages";

// Channel-per-trade Realtime subscription: Postgres Changes on `messages`
// filtered to this trade push directly into the TanStack Query cache instead
// of polling. The initial fetch (useMessages) owns the base list; this hook
// only appends incremental inserts, deduping by id against the sender's own
// optimistic append.
export function useTradeChannel(tradeId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tradeId) return;

    const channel = supabase
      .channel(`trade:${tradeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `trade_id=eq.${tradeId}` },
        async (payload) => {
          const newMessage = payload.new as Message;

          const { data: sender } = await supabase
            .from("profiles")
            .select("id, username, display_name")
            .eq("id", newMessage.sender_id)
            .single();

          queryClient.setQueryData<MessageWithSender[]>(["messages", tradeId], (old = []) => {
            if (old.some((m) => m.id === newMessage.id)) return old;
            return [...old, { ...newMessage, sender: sender ?? null }];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, tradeId]);
}
