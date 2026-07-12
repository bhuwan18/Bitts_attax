import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/lib/types/database.types";
import type { TradeMatch } from "@/lib/queries/matches";

export function TraderCard({
  trader,
  havesCount,
  match,
}: {
  trader: Profile;
  havesCount: number;
  match?: TradeMatch;
}) {
  const name = trader.display_name ?? trader.username;

  return (
    <Link
      href={`/traders/${trader.id}`}
      className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-border transition-colors hover:bg-accent"
    >
      <Avatar size="lg">
        <AvatarFallback className="bg-gradient-to-br from-primary to-brand font-heading font-extrabold text-primary-foreground">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{name}</p>
          {match && (
            <span
              className={
                match.mutual
                  ? "shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary"
                  : "shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning"
              }
            >
              {match.mutual ? "Mutual match" : "Has what you want"}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">@{trader.username}</p>
      </div>
      <p className="shrink-0 text-xs text-muted-foreground">
        {havesCount} {havesCount === 1 ? "card" : "cards"}
      </p>
    </Link>
  );
}
