"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RARITY_BORDER_CLASS, RARITY_GLOW_CLASS } from "@/lib/cards/rarity";
import { RarityBadge } from "@/components/cards/RarityBadge";
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
  // `term` is what's in the box; `query` is what was actually submitted. The
  // catalog is big enough that searching on every keystroke churned the results
  // out from under the user mid-type — nothing is fetched until they hit Search.
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const { data: cards, isLoading } = useCards(
    { search: query || undefined },
    { enabled: query.length > 0 }
  );

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex max-w-xl gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(term.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cards to add…"
            className="pl-9"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={!term.trim()}>
          Search
        </Button>
      </form>

      {!query && (
        <p className="text-sm text-muted-foreground">
          Enter a player or card name, then hit Search.
        </p>
      )}
      {query && isLoading && <p className="text-sm text-muted-foreground">Searching…</p>}
      {query && !isLoading && cards?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No cards match “{query}”. Try a shorter or different spelling.
        </p>
      )}

      {query && !isLoading && cards && cards.length > 0 && (
        <>
          <p className="text-xs font-medium text-muted-foreground">
            {cards.length} result{cards.length === 1 ? "" : "s"} for “{query}”
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {cards.map((card) => (
              <div key={card.id} className="flex flex-col gap-2 rounded-lg bg-card p-2">
                <div
                  className={cn(
                    "card-surface-gradient relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2",
                    RARITY_BORDER_CLASS[card.rarity] ?? RARITY_BORDER_CLASS.other,
                    RARITY_GLOW_CLASS[card.rarity] ?? RARITY_GLOW_CLASS.other
                  )}
                >
                  {card.image_url ? (
                    <Image
                      src={card.image_url}
                      alt={card.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                  {card.ovr_rating != null && (
                    <div className="absolute top-0 left-0 rounded-lg bg-foreground/90 px-2 py-1 font-heading text-base leading-none text-background backdrop-blur-sm">
                      {card.ovr_rating}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="truncate text-sm font-semibold">{card.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {card.team ?? "Free agent"}
                  </p>
                  {card.set_name && (
                    <p className="truncate text-[11px] text-muted-foreground/70">{card.set_name}</p>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-0.5">
                  <RarityBadge rarity={card.rarity} />
                  <Button
                    size="icon-sm"
                    variant="outline"
                    disabled={isAdding}
                    onClick={() => onAdd(card.id)}
                    aria-label={`${addLabel}: ${card.name}`}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
