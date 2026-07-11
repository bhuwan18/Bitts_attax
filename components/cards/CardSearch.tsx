"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CardFilters } from "@/components/cards/CardFilters";
import { CardGrid } from "@/components/cards/CardGrid";
import { useCards, type CardFilters as CardFiltersState } from "@/lib/queries/cards";

export function CardSearch() {
  const [filters, setFilters] = useState<CardFiltersState>({});
  const { data: cards, isLoading } = useCards(filters);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cards by name…"
            className="pl-9"
            value={filters.search ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
          />
        </div>
        <CardFilters filters={filters} onChange={setFilters} />
      </div>
      <CardGrid cards={cards} isLoading={isLoading} />
    </div>
  );
}
