"use client";

import { useState } from "react";
import Image from "next/image";
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
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search cards to add…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {search && (
        <div className="flex max-h-72 flex-col divide-y divide-border overflow-y-auto rounded-xl bg-card ring-1 ring-border">
          {isLoading && <p className="p-3 text-sm text-muted-foreground">Searching…</p>}
          {!isLoading && cards?.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">No cards found.</p>
          )}
          {cards?.slice(0, 10).map((card) => (
            <div key={card.id} className="flex items-center gap-2.5 p-2">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                {card.image_url && (
                  <Image src={card.image_url} alt={card.name} fill className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{card.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {card.team ?? "—"} · {card.rarity.replace("_", " ")}
                </p>
              </div>
              <Button
                size="icon-sm"
                variant="outline"
                disabled={isAdding}
                onClick={() => onAdd(card.id)}
                aria-label={addLabel}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
