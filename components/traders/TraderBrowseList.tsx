"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTraderHavesCounts, useTraders } from "@/lib/queries/traders";
import { TraderCard } from "@/components/traders/TraderCard";

export function TraderBrowseList() {
  const [search, setSearch] = useState("");
  const { data: traders, isLoading } = useTraders(search || undefined);
  const { data: havesCounts } = useTraderHavesCounts();

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
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

      <div className="flex flex-col gap-2">
        {traders?.map((trader) => (
          <TraderCard key={trader.id} trader={trader} havesCount={havesCounts?.[trader.id] ?? 0} />
        ))}
      </div>
    </div>
  );
}
