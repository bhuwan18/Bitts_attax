"use client";

import { BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarkAllNotificationsRead, useNotifications } from "@/lib/queries/notifications";
import { NotificationRow } from "@/components/notifications/NotificationRow";

export function NotificationList() {
  const { data: notifications, isLoading } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  const hasUnread = notifications?.some((n) => !n.read_at) ?? false;

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading notifications…</p>;

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/60 py-14 text-center">
        <BellOff className="size-7 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {hasUnread && (
        <Button
          size="sm"
          variant="outline"
          className="w-fit self-end"
          disabled={markAllRead.isPending}
          onClick={() => markAllRead.mutate()}
        >
          Mark all read
        </Button>
      )}
      <div className="flex flex-col gap-2">
        {notifications.map((notification) => (
          <NotificationRow key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  );
}
