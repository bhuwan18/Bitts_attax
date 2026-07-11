"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { markAllNotificationsRead, markNotificationRead } from "@/app/(main)/notifications/actions";
import type { Notification, NotificationType, Profile } from "@/lib/types/database.types";

export interface NotificationWithActor extends Notification {
  type: NotificationType;
  actor: Pick<Profile, "id" | "username" | "display_name"> | null;
}

export function useNotifications() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["notifications"],
    queryFn: async (): Promise<NotificationWithActor[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, actor:profiles!notifications_actor_id_fkey(id, username, display_name)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as unknown as NotificationWithActor[];
    },
  });
}

export function useUnreadNotificationsCount() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .is("read_at", null);

      if (error) throw error;
      return count ?? 0;
    },
  });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
  });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: invalidate,
  });
}
