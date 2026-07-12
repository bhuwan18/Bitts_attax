"use client";

import { useCurrentUser } from "@/lib/queries/auth";
import { useNotificationsChannel } from "@/lib/realtime/useNotificationsChannel";

// Mounted exactly once (in app/(main)/layout.tsx) so there's a single
// Realtime subscription per session. Sidebar and MobileNav are both always
// mounted regardless of viewport (CSS hides one, not React) — calling
// useNotificationsChannel from each of them subscribed the same
// `notifications:<userId>` channel topic twice, and Supabase's client throws
// ("cannot add postgres_changes callbacks ... after subscribe()") when a
// second .on() is registered on an already-subscribed channel.
export function NotificationsListener() {
  const { data: user } = useCurrentUser();
  useNotificationsChannel(user?.id);
  return null;
}
