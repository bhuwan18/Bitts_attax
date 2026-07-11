"use client";

import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import {
  cardsDistinctTeamsQueryKey,
  cardsDistinctSetNamesQueryKey,
  fetchDistinctTeams,
  fetchDistinctSetNames,
  type CardFilters as CardFiltersState,
} from "@/lib/queries/cardsShared";
import { POSITION_OPTIONS } from "@/lib/cards/position";
import type { Rarity } from "@/lib/types/database.types";

const RARITY_OPTIONS: { value: Rarity; label: string }[] = [
  { value: "common", label: "Common" },
  { value: "uncommon", label: "Uncommon" },
  { value: "rare", label: "Rare" },
  { value: "super_rare", label: "Super Rare" },
  { value: "legend", label: "Legend" },
  { value: "limited", label: "Limited" },
];

const FACET_KEYS = ["rarity", "position", "team", "setName"] as const;

function countActiveFacets(filters: CardFiltersState) {
  return FACET_KEYS.filter((key) => filters[key]).length;
}

// A long staleTime here is deliberate: team/set options only change when new
// cards are ingested, so there's no need to re-fetch them on every panel open.
const FACET_OPTIONS_STALE_TIME = 5 * 60_000;

export function CardFilters({
  filters,
  onChange,
}: {
  filters: CardFiltersState;
  onChange: (next: CardFiltersState) => void;
}) {
  const supabase = useSupabase();

  const { data: teams } = useQuery({
    queryKey: cardsDistinctTeamsQueryKey,
    queryFn: () => fetchDistinctTeams(supabase),
    staleTime: FACET_OPTIONS_STALE_TIME,
  });
  const { data: setNames } = useQuery({
    queryKey: cardsDistinctSetNamesQueryKey,
    queryFn: () => fetchDistinctSetNames(supabase),
    staleTime: FACET_OPTIONS_STALE_TIME,
  });

  const activeCount = countActiveFacets(filters);

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" className="gap-1.5" />}>
        <SlidersHorizontal className="size-4" />
        Filters
        {activeCount > 0 && (
          <Badge variant="secondary" className="ml-0.5">
            {activeCount}
          </Badge>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4">
          <div className="flex flex-col gap-1.5">
            <Label>Rarity</Label>
            <Select
              value={filters.rarity ?? "all"}
              onValueChange={(value) =>
                onChange({
                  ...filters,
                  rarity: !value || value === "all" ? undefined : (value as Rarity),
                })
              }
            >
              <SelectTrigger className="w-full">
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
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Position</Label>
            <Select
              value={filters.position ?? "all"}
              onValueChange={(value) =>
                onChange({ ...filters, position: !value || value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All positions</SelectItem>
                {POSITION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Team</Label>
            <Select
              value={filters.team ?? "all"}
              onValueChange={(value) =>
                onChange({ ...filters, team: !value || value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teams</SelectItem>
                {teams?.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Set</Label>
            <Select
              value={filters.setName ?? "all"}
              onValueChange={(value) =>
                onChange({ ...filters, setName: !value || value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All sets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sets</SelectItem>
                {setNames?.map((setName) => (
                  <SelectItem key={setName} value={setName}>
                    {setName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {activeCount > 0 && (
          <SheetFooter>
            <Button variant="ghost" onClick={() => onChange({ search: filters.search })}>
              Clear filters
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
