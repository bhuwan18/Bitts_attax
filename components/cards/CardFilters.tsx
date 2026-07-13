"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { RARITY_STYLE } from "@/lib/cards/rarity";
import { cn } from "@/lib/utils";
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
// cards are ingested, so there's no need to re-fetch them on every mount.
const FACET_OPTIONS_STALE_TIME = 5 * 60_000;

function FilterPill({
  active,
  activeClassName,
  onClick,
  children,
}: {
  active: boolean;
  activeClassName?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
        active
          ? cn("ring-2 ring-foreground/50", activeClassName ?? "bg-primary text-primary-foreground")
          : "bg-background text-muted-foreground ring-1 ring-border hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

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
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <FilterPill active={!filters.rarity} onClick={() => onChange({ ...filters, rarity: undefined })}>
          All
        </FilterPill>
        {RARITY_OPTIONS.map((option) => (
          <FilterPill
            key={option.value}
            active={filters.rarity === option.value}
            activeClassName={RARITY_STYLE[option.value]}
            onClick={() =>
              onChange({
                ...filters,
                rarity: filters.rarity === option.value ? undefined : option.value,
              })
            }
          >
            {option.label}
          </FilterPill>
        ))}
      </div>

      <Separator orientation="vertical" className="h-5" />

      <div className="flex flex-wrap items-center gap-1.5">
        <FilterPill
          active={!filters.position}
          onClick={() => onChange({ ...filters, position: undefined })}
        >
          All
        </FilterPill>
        {POSITION_OPTIONS.map((option) => (
          <FilterPill
            key={option.value}
            active={filters.position === option.value}
            onClick={() =>
              onChange({
                ...filters,
                position: filters.position === option.value ? undefined : option.value,
              })
            }
          >
            {option.value}
          </FilterPill>
        ))}
      </div>

      <Separator orientation="vertical" className="h-5" />

      <Select
        value={filters.team ?? "all"}
        onValueChange={(value) =>
          onChange({ ...filters, team: !value || value === "all" ? undefined : value })
        }
      >
        <SelectTrigger size="sm" className="w-[140px]">
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

      <Select
        value={filters.setName ?? "all"}
        onValueChange={(value) =>
          onChange({ ...filters, setName: !value || value === "all" ? undefined : value })
        }
      >
        <SelectTrigger size="sm" className="w-[140px]">
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

      {/* Clears the facets only — the search term is owned by CardSearch (it
          lives outside this state so it can be debounced), so it survives, which
          is the same behaviour this had when it re-seeded `search` by hand. */}
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={() => onChange({})}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
