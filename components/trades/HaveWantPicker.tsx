"use client";

import { useState } from "react";
import { Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { useCards } from "@/lib/queries/cards";

export interface PickedItem {
  cardId: string;
  name: string;
  quantity: number;
}

export function HaveWantPicker({
  label,
  items,
  onChange,
}: {
  label: string;
  items: PickedItem[];
  onChange: (items: PickedItem[]) => void;
}) {
  const [search, setSearch] = useState("");
  const { data: cards, isLoading } = useCards({ search: search || undefined });

  function addCard(cardId: string, name: string) {
    if (items.some((i) => i.cardId === cardId)) return;
    onChange([...items, { cardId, name, quantity: 1 }]);
    setSearch("");
  }

  function updateQuantity(cardId: string, quantity: number) {
    onChange(items.map((i) => (i.cardId === cardId ? { ...i, quantity } : i)));
  }

  function removeCard(cardId: string) {
    onChange(items.filter((i) => i.cardId !== cardId));
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{label}</p>
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search cards…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {search && (
        <div className="flex max-h-48 flex-col divide-y divide-border overflow-y-auto rounded-xl bg-card ring-1 ring-border">
          {isLoading && <p className="p-2.5 text-sm text-muted-foreground">Searching…</p>}
          {cards?.slice(0, 8).map((card) => (
            <button
              key={card.id}
              type="button"
              className="flex items-center justify-between gap-2 p-2.5 text-left text-sm transition-colors hover:bg-accent"
              onClick={() => addCard(card.id, card.name)}
            >
              <span className="truncate">{card.name}</span>
              <Plus className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div
            key={item.cardId}
            className="flex items-center gap-2 rounded-xl bg-card p-2 pl-3 ring-1 ring-border"
          >
            <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
            <QuantityStepper
              value={item.quantity}
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
