"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CardFilters as CardFiltersState } from "@/lib/queries/cards";
import type { Rarity } from "@/lib/types/database.types";

const RARITY_OPTIONS: { value: Rarity; label: string }[] = [
  { value: "common", label: "Common" },
  { value: "uncommon", label: "Uncommon" },
  { value: "rare", label: "Rare" },
  { value: "super_rare", label: "Super Rare" },
  { value: "legend", label: "Legend" },
  { value: "limited", label: "Limited" },
];

export function CardFilters({
  filters,
  onChange,
}: {
  filters: CardFiltersState;
  onChange: (next: CardFiltersState) => void;
}) {
  return (
    <Select
      value={filters.rarity ?? "all"}
      onValueChange={(value) =>
        onChange({ ...filters, rarity: !value || value === "all" ? undefined : (value as Rarity) })
      }
    >
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="All rarities" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All rarities</SelectItem>
        {RARITY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
