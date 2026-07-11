"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { sendMessage } from "@/app/(main)/trades/[tradeId]/chat/actions";
import type { Message, Profile } from "@/lib/types/database.types";

export interface MessageWithSender extends Message {
  sender: Pick<Profile, "id" | "username" | "display_name"> | null;
}

export function useMessages(tradeId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["messages", tradeId],
    queryFn: async (): Promise<MessageWithSender[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:profiles(id, username, display_name)")
        .eq("trade_id", tradeId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as MessageWithSender[];
    },
    enabled: !!tradeId,
  });
}

export function useSendMessage(tradeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => sendMessage(tradeId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", tradeId] });
    },
  });
}
