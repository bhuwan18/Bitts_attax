"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardFilters } from "@/components/cards/CardFilters";
import { CardGrid } from "@/components/cards/CardGrid";
import { useCardsInfinite, type CardFilters as CardFiltersState } from "@/lib/queries/cards";

const SEARCH_DEBOUNCE_MS = 300;

export function CardSearch() {
  const [filters, setFilters] = useState<CardFiltersState>({});
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((f) => ({ ...f, search: inputValue || undefined }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [inputValue]);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useCardsInfinite(filters);
  const cards = data?.pages.flat();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
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
