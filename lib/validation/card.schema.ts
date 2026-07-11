import { z } from "zod";

export const RARITY_VALUES = [
  "common",
  "uncommon",
  "rare",
  "super_rare",
  "legend",
  "limited",
  "other",
] as const;

// Maps arbitrary source spellings/abbreviations onto our canonical rarity enum.
// Extend this table as new sources introduce new aliases; unmatched values
// fall back to "other" rather than failing the whole ingest run.
const RARITY_ALIASES: Record<string, (typeof RARITY_VALUES)[number]> = {
  common: "common",
  c: "common",
  uncommon: "uncommon",
  unc: "uncommon",
  rare: "rare",
  r: "rare",
  "super rare": "super_rare",
  superrare: "super_rare",
  "super-rare": "super_rare",
  sr: "super_rare",
  legend: "legend",
  legendary: "legend",
  l: "legend",
  limited: "limited",
  "limited edition": "limited",
  le: "limited",

  // corinthianseller.co.uk (Match Attax 2024/25) cardtype labels. Some of these carry a
  // trailing "(Update N)" suffix on the site that increments over the season — stripped by
  // normalizeRarity() below before this lookup runs, so the bare label is enough here.
  "1st edition": "common",
  "club logos": "common",
  captain: "uncommon",
  "festive squadzone": "uncommon",
  "new signings": "uncommon",
  "scream team": "uncommon",
  "snow ballers": "uncommon",
  "star ballers": "uncommon",
  "queens of europe": "uncommon",
  "100 club": "rare",
  "black edge": "rare",
  "crystal foil parallel": "rare",
  tactic: "rare",
  "tactic cards": "rare",
  "topps heritage": "rare",
  "gold edge": "super_rare",
  "pro elite shield": "super_rare",
  "starburst exclusive": "super_rare",
  starburst: "super_rare",
  "trophy triumph": "super_rare",
  "man of the match signature": "legend",
  "match attax hall of fame": "legend",
  "vintage vibes legends": "legend",
  "platinum pull limited": "limited",
  "platinum pull": "limited",
  "entertainers limited": "limited",
  "classic celebration limited": "limited",
  "generation now limited": "limited",
  "time to shine limited": "limited",
  "blue diamond limited": "limited",
};

export function normalizeRarity(raw: unknown): (typeof RARITY_VALUES)[number] {
  if (typeof raw !== "string") return "other";
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*$/, "");
  return RARITY_ALIASES[key] ?? "other";
}

// Canonical shape every adapter's raw output must be transformed into before
// it reaches upsertCards.ts. Mirrors the `cards` table columns.
export const NormalizedCardSchema = z.object({
  external_ref: z.string().nullable().default(null),
  source: z.string().min(1),
  name: z.string().min(1),
  team: z.string().nullable().default(null),
  position: z.string().nullable().default(null),
  rarity: z.enum(RARITY_VALUES),
  ovr_rating: z.number().int().min(0).max(99).nullable().default(null),
  base_price: z.number().min(0).nullable().default(null),
  image_url: z.url().nullable().default(null),
  set_name: z.string().nullable().default(null),
  season: z.string().nullable().default(null),
  attributes: z.record(z.string(), z.unknown()).default({}),
});

export type NormalizedCard = z.infer<typeof NormalizedCardSchema>;

// Loose input schema for CSV/JSON rows: everything arrives as strings from
// CSV, so coerce before validating. `.passthrough()` keeps unknown columns
// around for the attributes bag rather than rejecting the row outright.
export const RawCardRowSchema = z
  .object({
    external_ref: z.union([z.string(), z.number()]).optional(),
    name: z.string().min(1),
    team: z.string().optional(),
    position: z.string().optional(),
    rarity: z.string().optional(),
    ovr_rating: z.coerce.number().int().min(0).max(99).optional(),
    base_price: z.coerce.number().min(0).optional(),
    image_url: z.string().optional(),
    set_name: z.string().optional(),
    season: z.string().optional(),
  })
  .passthrough();

export type RawCardRow = z.infer<typeof RawCardRowSchema>;
