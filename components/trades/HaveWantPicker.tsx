"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { useCards } from "@/lib/queries/cards";
import type { Card } from "@/lib/types/database.types";

/** A card the user can add to a listing, flattened to just what the UI renders. */
export interface CardOption {
  cardId: string;
  name: string;
  team: string | null;
  imageUrl: string | null;
  ovrRating: number | null;
  basePrice: number | null;
  /** For inventory-sourced Haves: how many the user actually owns (caps quantity). */
  maxQuantity?: number;
}

export interface PickedItem extends CardOption {
  quantity: number;
}

export function cardToOption(card: Card, overrides?: Partial<CardOption>): CardOption {
  return {
    cardId: card.id,
    name: card.name,
    team: card.team,
    imageUrl: card.image_url,
    ovrRating: card.ovr_rating,
    basePrice: card.base_price,
    ...overrides,
  };
}

export function HaveWantPicker({
  label,
  hint,
  items,
  onChange,
  accent = "primary",
  suggestions = [],
  suggestionsLabel,
  suggestionsEmpty,
  searchPlaceholder = "Search the full catalog…",
  searchScope = "catalog",
}: {
  label: string;
  hint?: string;
  items: PickedItem[];
  onChange: (items: PickedItem[]) => void;
  accent?: "success" | "primary";
  /** Cards surfaced before the user types — their inventory / want-list. */
  suggestions?: CardOption[];
  suggestionsLabel?: string;
  suggestionsEmpty?: string;
  searchPlaceholder?: string;
  /**
   * Where typing searches. "suggestions" narrows the given options in memory and
   * never queries the catalog — for pickers where an arbitrary card would be an
   * invalid choice, e.g. you can only request cards a trader actually owns.
   */
  searchScope?: "catalog" | "suggestions";
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const showingSearch = search.length > 0;
  const searchingCatalog = showingSearch && searchScope === "catalog";
  const { data: cards, isLoading } = useCards(
    { search: search || undefined },
    { enabled: searchingCatalog }
  );

  const added = new Set(items.map((i) => i.cardId));

  // What the dropdown shows: matches while typing, suggestions otherwise.
  const searchResults: CardOption[] = !showingSearch
    ? []
    : searchingCatalog
      ? (cards ?? []).slice(0, 8).map((c) => cardToOption(c))
      : suggestions
          .filter((o) =>
            `${o.name} ${o.team ?? ""}`.toLowerCase().includes(search.toLowerCase())
          )
          .slice(0, 8);

  function addCard(option: CardOption) {
    if (added.has(option.cardId)) return;
    onChange([...items, { ...option, quantity: 1 }]);
    // Keep the query so several matches can be added in a row.
  }

  function updateQuantity(cardId: string, quantity: number) {
    onChange(items.map((i) => (i.cardId === cardId ? { ...i, quantity } : i)));
  }

  function removeCard(cardId: string) {
    onChange(items.filter((i) => i.cardId !== cardId));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "size-2 rounded-full",
            accent === "success" ? "bg-success" : "bg-primary"
          )}
          aria-hidden
        />
        <p className="text-sm font-semibold">{label}</p>
        {items.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {items.length} added
          </span>
        )}
      </div>
      {hint && <p className="-mt-1 text-xs text-muted-foreground">{hint}</p>}

      {/* Search + dropdown. onFocus/onBlur on the wrapper keeps the panel open
          while clicking rows inside it, so multiple cards can be added quickly. */}
      <div
        className="relative"
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
        }}
      >
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {open && (
          <div className="absolute z-20 mt-1.5 flex max-h-72 w-full flex-col overflow-y-auto rounded-xl bg-card p-1 shadow-lg ring-1 ring-border">
            {showingSearch ? (
              <>
                {isLoading && (
                  <p className="p-2.5 text-sm text-muted-foreground">Searching…</p>
                )}
                {!isLoading && searchResults.length === 0 && (
                  <p className="p-2.5 text-sm text-muted-foreground">
                    No cards match “{search}”.
                  </p>
                )}
                {searchResults.map((option) => (
                  <OptionRow
                    key={option.cardId}
                    option={option}
                    accent={accent}
                    isAdded={added.has(option.cardId)}
                    onAdd={() => addCard(option)}
                  />
                ))}
              </>
            ) : (
              <>
                {suggestionsLabel && (
                  <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    {suggestionsLabel}
                  </p>
                )}
                {suggestions.length === 0 && (
                  <p className="p-2.5 text-sm text-muted-foreground">
                    {suggestionsEmpty ?? "Start typing to search the catalog."}
                  </p>
                )}
                {suggestions.map((option) => (
                  <OptionRow
                    key={option.cardId}
                    option={option}
                    accent={accent}
                    isAdded={added.has(option.cardId)}
                    onAdd={() => addCard(option)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Chosen cards */}
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div
            key={item.cardId}
            className="flex items-center gap-2.5 rounded-xl bg-card p-2 ring-1 ring-border"
          >
            <CardThumb name={item.name} imageUrl={item.imageUrl} ovrRating={item.ovrRating} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.name}</p>
              <p className="truncate text-xs text-muted-foreground">{item.team ?? "—"}</p>
            </div>
            <QuantityStepper
              value={item.quantity}
              max={item.maxQuantity ?? 999}
              onChange={(quantity) => updateQuantity(item.cardId, quantity)}
            />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => removeCard(item.cardId)}
              aria-label={`Remove ${item.name}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="px-1 text-xs text-muted-foreground">No cards added yet.</p>
        )}
      </div>
    </div>
  );
}

function OptionRow({
  option,
  accent,
  isAdded,
  onAdd,
}: {
  option: CardOption;
  accent: "success" | "primary";
  isAdded: boolean;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      // Prevent the wrapper losing focus so the panel stays open for multi-add.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onAdd}
      disabled={isAdded}
      className={cn(
        "flex items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors",
        isAdded ? "opacity-60" : "hover:bg-accent"
      )}
    >
      <CardThumb name={option.name} imageUrl={option.imageUrl} ovrRating={option.ovrRating} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{option.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {option.team ?? "—"}
          {typeof option.maxQuantity === "number" && ` · ${option.maxQuantity} owned`}
        </p>
      </div>
      {isAdded ? (
        <span className="flex items-center gap-1 pr-1 text-xs font-medium text-muted-foreground">
          <Check className="size-3.5" /> Added
        </span>
      ) : (
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-border",
            accent === "success" ? "text-success" : "text-primary"
          )}
        >
          <Plus className="size-4" />
        </span>
      )}
    </button>
  );
}

function CardThumb({
  name,
  imageUrl,
  ovrRating,
}: {
  name: string;
  imageUrl: string | null;
  ovrRating: number | null;
}) {
  return (
    <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
      {imageUrl && <Image src={imageUrl} alt={name} fill className="object-cover" sizes="44px" />}
      {typeof ovrRating === "number" && (
        <Badge
          variant="secondary"
          className="absolute bottom-0 left-0 h-auto rounded-none rounded-tr-md px-1 py-0 text-[9px] leading-tight font-bold tabular-nums"
        >
          {ovrRating}
        </Badge>
      )}
    </div>
  );
}
