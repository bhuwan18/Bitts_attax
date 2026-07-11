"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMarkNotificationRead } from "@/lib/queries/notifications";
import type { NotificationWithActor } from "@/lib/queries/notifications";

const MESSAGE_BY_TYPE: Record<NotificationWithActor["type"], (actor: string) => string> = {
  trade_proposed: (actor) => `${actor} sent you a trade request`,
  trade_accepted: (actor) => `${actor} accepted your trade`,
  trade_rejected: (actor) => `${actor} declined your trade`,
  trade_completed: (actor) => `${actor} marked your trade as completed`,
  trade_cancelled: (actor) => `${actor} cancelled your trade`,
};

function formatRelativeTime(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationRow({ notification }: { notification: NotificationWithActor }) {
  const router = useRouter();
  const markRead = useMarkNotificationRead();

  const actorName =
    notification.actor?.display_name ?? notification.actor?.username ?? "Someone";
  const message = MESSAGE_BY_TYPE[notification.type]?.(actorName) ?? "New notification";
  const isUnread = !notification.read_at;

  function handleClick() {
    if (isUnread) markRead.mutate(notification.id);
    if (notification.trade_id) router.push(`/trades/${notification.trade_id}`);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl p-3 text-left ring-1 ring-border transition-colors hover:bg-accent",
        isUnread ? "bg-primary/5" : "bg-card"
      )}
    >
      {isUnread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
      <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", !isUnread && "pl-5")}>
        <p className="truncate text-sm font-medium">{message}</p>
        <p className="text-xs text-muted-foreground">{formatRelativeTime(notification.created_at)}</p>
      </div>
    </button>
  );
}
