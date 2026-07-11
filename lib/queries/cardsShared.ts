import type { SupabaseClient } from "@supabase/supabase-js";
import type { Card, Database, Rarity } from "@/lib/types/database.types";

export interface CardFilters {
  search?: string;
  rarity?: Rarity;
  team?: string;
  position?: string;
  setName?: string;
}

export const CARDS_PAGE_SIZE = 30;

export type CardListItem = Pick<
  Card,
  "id" | "name" | "team" | "rarity" | "ovr_rating" | "base_price" | "image_url"
>;

// Server prefetch (app/(main)/cards/page.tsx) and the client useInfiniteQuery
// (lib/queries/cards.ts) must build this identically — dehydrate/HydrationBoundary
// match dehydrated queries to client observers by hashing this key.
export function cardsInfiniteQueryKey(filters: CardFilters = {}) {
  return ["cards", "list", filters] as const;
}

export async function fetchCardsPage(
  supabase: SupabaseClient<Database>,
  filters: CardFilters,
  pageParam: number
): Promise<CardListItem[]> {
  let query = supabase
    .from("cards")
    .select("id, name, team, rarity, ovr_rating, base_price, image_url")
    // ovr_rating has heavy duplicate values; tie-break by id so .range()
    // pagination can't duplicate or skip rows across page boundaries.
    .order("ovr_rating", { ascending: false })
    .order("id", { ascending: true });

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }
  if (filters.rarity) {
    query = query.eq("rarity", filters.rarity);
  }
  if (filters.team) {
    query = query.eq("team", filters.team);
  }
  if (filters.position) {
    query = query.eq("position", filters.position);
  }
  if (filters.setName) {
    query = query.eq("set_name", filters.setName);
  }

  const start = pageParam * CARDS_PAGE_SIZE;
  const { data, error } = await query.range(start, start + CARDS_PAGE_SIZE - 1);
  if (error) throw error;
  return (data ?? []) as CardListItem[];
}

export function getNextCardsPageParam(lastPage: CardListItem[], allPages: CardListItem[][]) {
  return lastPage.length === CARDS_PAGE_SIZE ? allPages.length : undefined;
}

// team/set_name are free-text (no check constraint like rarity), and
// postgrest-js has no DISTINCT support in its query builder, so the option
// lists for those two filter dropdowns come from RPC functions defined in
// supabase/migrations/0006_cards_filter_facets.sql rather than a full-table
// select + client-side dedupe.
export const cardsDistinctTeamsQueryKey = ["cards", "distinct-teams"] as const;
export const cardsDistinctSetNamesQueryKey = ["cards", "distinct-set-names"] as const;

export async function fetchDistinctTeams(supabase: SupabaseClient<Database>): Promise<string[]> {
  const { data, error } = await supabase.rpc("cards_distinct_teams");
  if (error) throw error;
  return (data ?? []).map((row) => row.team);
}

export async function fetchDistinctSetNames(
  supabase: SupabaseClient<Database>
): Promise<string[]> {
  const { data, error } = await supabase.rpc("cards_distinct_set_names");
  if (error) throw error;
  return (data ?? []).map((row) => row.set_name);
}
