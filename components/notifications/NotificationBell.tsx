"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadNotificationsCount } from "@/lib/queries/notifications";

// Realtime subscription lives in NotificationsListener.tsx (mounted once in
// app/(main)/layout.tsx) — this just reads the query it keeps invalidated.
export function NotificationBell() {
  const { data: unreadCount } = useUnreadNotificationsCount();
  const active = usePathname().startsWith("/notifications");

  return (
    <Link
      href="/notifications"
      aria-label={unreadCount ? `Notifications (${unreadCount} unread)` : "Notifications"}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-full transition-colors",
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Bell className="size-[18px]" strokeWidth={active ? 2.5 : 2} />
      {!!unreadCount && (
        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />
      )}
    </Link>
  );
}
