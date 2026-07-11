import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types/database.types";

export function TraderCard({ trader, havesCount }: { trader: Profile; havesCount: number }) {
  const name = trader.display_name ?? trader.username;
  const initial = name.charAt(0).toUpperCase();

  return (
    <Link
      href={`/traders/${trader.id}`}
      className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-border transition-colors hover:bg-accent"
    >
      <Avatar size="lg">
        <AvatarFallback className="bg-primary font-heading font-extrabold text-primary-foreground">
          {initial}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="truncate text-xs text-muted-foreground">@{trader.username}</p>
      </div>
      <p className="shrink-0 text-xs text-muted-foreground">
        {havesCount} {havesCount === 1 ? "card" : "cards"}
      </p>
    </Link>
  );
}
