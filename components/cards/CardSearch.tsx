"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardFilters } from "@/components/cards/CardFilters";
import { CardGrid } from "@/components/cards/CardGrid";
import { useCardsInfinite, type CardFilters as CardFiltersState } from "@/lib/queries/cards";
import { useDebouncedValue, SEARCH_DEBOUNCE_MS } from "@/lib/hooks/useDebouncedValue";

export function CardSearch() {
  // Everything except the search box — those come from dropdowns, so they're
  // already one deliberate change per query and need no debouncing.
  const [filters, setFilters] = useState<CardFiltersState>({});
  const [inputValue, setInputValue] = useState("");
  const debouncedSearch = useDebouncedValue(inputValue, SEARCH_DEBOUNCE_MS);

  // Merged rather than folded back into `filters` state: the old version wrote
  // the debounced term into `filters` from an effect, which meant a render with
  // the new text and the old results (and a second render to correct it).
  const activeFilters = useMemo<CardFiltersState>(
    () => ({ ...filters, search: debouncedSearch || undefined }),
    [filters, debouncedSearch]
  );

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useCardsInfinite(activeFilters);
  const cards = data?.pages.flat();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cards by name…"
            className="pl-9"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>
        <CardFilters filters={filters} onChange={setFilters} />
      </div>
      <CardGrid cards={cards} isLoading={isLoading} />
      {cards && cards.length > 0 && hasNextPage && (
        <Button
          variant="outline"
          className="mx-auto"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
