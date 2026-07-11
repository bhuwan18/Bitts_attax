"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useUnreadNotificationsCount } from "@/lib/queries/notifications";

// Realtime subscription lives in NotificationsListener.tsx (mounted once in
// app/(main)/layout.tsx) — this just reads the query it keeps invalidated.
export function NotificationBell() {
  const { data: unreadCount } = useUnreadNotificationsCount();

  return (
    <Link
      href="/notifications"
      aria-label={unreadCount ? `Notifications (${unreadCount} unread)` : "Notifications"}
      className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Bell className="size-[18px]" />
      {!!unreadCount && (
        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />
      )}
    </Link>
  );
}
