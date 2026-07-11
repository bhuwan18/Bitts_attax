"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCards } from "@/lib/queries/cards";

export function CardPicker({
  onAdd,
  isAdding,
  addLabel = "Add",
}: {
  onAdd: (cardId: string) => void;
  isAdding?: boolean;
  addLabel?: string;
}) {
  const [search, setSearch] = useState("");
  const { data: cards, isLoading } = useCards({ search: search || undefined });

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search cards to add…"
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {search && (
        <div className="flex max-h-64 flex-col divide-y overflow-y-auto rounded-md border">
          {isLoading && <p className="p-3 text-sm text-muted-foreground">Searching…</p>}
          {!isLoading && cards?.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">No cards found.</p>
          )}
          {cards?.slice(0, 10).map((card) => (
            <div key={card.id} className="flex items-center justify-between gap-2 p-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{card.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {card.team ?? "—"} · {card.rarity.replace("_", " ")}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={isAdding}
                onClick={() => onAdd(card.id)}
              >
                <Plus className="size-4" />
                {addLabel}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
