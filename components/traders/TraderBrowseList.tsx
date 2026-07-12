"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTraderHavesCounts, useTraders } from "@/lib/queries/traders";
import { useTradeMatches } from "@/lib/queries/matches";
import { TraderCard } from "@/components/traders/TraderCard";

export function TraderBrowseList() {
  const [search, setSearch] = useState("");
  const { data: traders, isLoading } = useTraders(search || undefined);
  const { data: havesCounts } = useTraderHavesCounts();
  // One query feeding a per-row lookup, not N queries — same shape as
  // useTraderHavesCounts() above.
  const { data: matches } = useTradeMatches(100);
  const matchByUserId = new Map((matches ?? []).map((m) => [m.userId, m]));

  return (
    <div className="flex flex-col gap-4">
      {/* Capped to a control width — a search box shouldn't stretch across the
          full two-column trader grid on a wide screen. */}
      <div className="relative max-w-xl">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search traders…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading traders…</p>}

      {!isLoading && (!traders || traders.length === 0) && (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/60 py-14 text-center">
          <Users className="size-7 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">No traders found.</p>
        </div>
      )}

      {/* Two columns from tablet up — trader rows are thin, so a single centred
          column wastes most of a landscape iPad. */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {traders?.map((trader, i) => (
          <div
            key={trader.id}
            style={{ animationDelay: `${(i % 10) * 35}ms` }}
            className="animate-in fade-in-0 slide-in-from-bottom-4 fill-mode-both animation-duration-400"
          >
            <TraderCard
              trader={trader}
              havesCount={havesCounts?.[trader.id] ?? 0}
              match={matchByUserId.get(trader.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
