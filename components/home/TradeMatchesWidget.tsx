"use client";

import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getInitials } from "@/lib/utils";
import { useTradeMatches } from "@/lib/queries/matches";

export function TradeMatchesWidget() {
  const { data: matches } = useTradeMatches(3);

  if (!matches || matches.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-heading text-lg font-bold">Trade matches</h2>
        <Link href="/traders" className="text-sm text-primary">
          See all
        </Link>
      </div>
      <ScrollArea>
        <div className="flex gap-3 pb-3">
          {matches.map((match) => {
            const name = match.profile.display_name ?? match.profile.username ?? "Collector";
            return (
              <Link
                key={match.userId}
                href={`/traders/${match.userId}`}
                className="flex w-44 shrink-0 flex-col gap-2 rounded-lg bg-card p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
                    {getInitials(name)}
                  </span>
                  <span className="truncate text-sm font-semibold">{name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  has {match.theyHaveCount} card{match.theyHaveCount === 1 ? "" : "s"} you want
                </span>
                <span
                  className={
                    match.mutual
                      ? "self-start rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary"
                      : "self-start rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning"
                  }
                >
                  {match.mutual ? "Mutual match" : "Has what you want"}
                </span>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
