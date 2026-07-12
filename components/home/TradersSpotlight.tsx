"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useTraders, useTraderHavesCounts } from "@/lib/queries/traders";

// No formal leaderboard/scoring system exists — this surfaces real activity
// (Haves count) rather than an invented ranking.
export function TradersSpotlight() {
  const { data: traders } = useTraders();
  const { data: havesCounts } = useTraderHavesCounts();

  if (!traders || traders.length === 0) return null;

  const spotlight = [...traders]
    .sort((a, b) => (havesCounts?.[b.id] ?? 0) - (havesCounts?.[a.id] ?? 0))
    .slice(0, 4);

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-heading text-lg">Active traders</h2>
        <Link href="/traders" className="text-sm text-primary">
          See all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {spotlight.map((trader, i) => {
          const name = trader.display_name ?? trader.username;
          return (
            <Link
              key={trader.id}
              href={`/traders/${trader.id}`}
              style={{ animationDelay: `${i * 40}ms` }}
              className="animate-in fade-in-0 slide-in-from-bottom-4 fill-mode-both animation-duration-400 flex items-center gap-2.5 rounded-2xl bg-card p-3 transition-transform duration-300 ease-[var(--ease-out-quint)] hover:-translate-y-1"
            >
              <Avatar className="size-9 shrink-0">
                {trader.avatar_url && <AvatarImage src={trader.avatar_url} alt={name} />}
                <AvatarFallback className="bg-gradient-to-br from-primary to-brand text-xs font-extrabold text-primary-foreground">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <Users className="size-3" />
                  {havesCounts?.[trader.id] ?? 0} cards
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
