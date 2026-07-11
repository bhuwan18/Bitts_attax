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

  // Additional labels found across older/newer seasons and the "Extra" companion sets (same site,
  // same convention — see corinthianSellerSeasons.ts). Kept in the same broad semantic tiers as
  // the aliases above: base/seasonal-update inserts -> common/uncommon, foil/milestone parallels
  // and themed inserts -> rare, chase/premium inserts -> super_rare, signature/relic/1-of-a-kind
  // -> legend, anything with "Limited Edition" in the name -> limited.
  "crystal parallel": "rare",
  "pro elite": "super_rare",
  "man of the match heritage": "legend",
  "hat-tirck hero": "rare",
  "hat trick hero": "rare",
  "out of this world": "super_rare",
  "mega value": "uncommon",
  "away kit": "uncommon",
  "headline hero": "super_rare",
  managers: "uncommon",
  "performance boost": "uncommon",
  "squad update": "uncommon",
  "squad zone": "uncommon",
  "man of the match": "rare",
  "chrome shield": "legend",
  superstar: "super_rare",
  "master and apprentice": "rare",
  heritage: "rare",
  "proview signature style": "legend",
  "chrome x": "super_rare",
  "hot prospect": "super_rare",
  "chrome award winner": "super_rare",
  infinity: "super_rare",
  "galactic exclusive edition": "legend",
  "gladiators limited edition": "limited",
  "worldies limited edition": "limited",
  "the graduates": "super_rare",
  "ball master": "super_rare",
  "man of the match wildcard": "rare",
  "cup champion": "super_rare",
  "all action hero": "rare",
  "counter attax": "rare",
  showboat: "rare",
  "stealth strike": "rare",
  "magic memories": "rare",
  "design your own card winner": "legend",
  "3d x-lens phase shifter": "legend",
  "ucl decades relic": "legend",
  "x calibre": "super_rare",
  "build an ultimate baller": "uncommon",
  "clutch kids": "rare",
  "uwcl woman of the match": "rare",
  "kings of europe": "uncommon",

  // Third pass: older seasons (back to 2021/22) and more "Extra" inserts. Same tiering logic as
  // above. Empty string shows up when the site renders an empty cardtype cell — same as an absent
  // cardtype, i.e. the base/common tier.
  "": "common",
  "pitch perfection": "rare",
  wingman: "uncommon",
  "manager tactic": "uncommon",
  "away kits": "uncommon",
  "uefa womens champions league": "uncommon",
  "uefa cards": "uncommon",
  "ucl knockout master": "super_rare",
  "man of the match legend": "legend",
  "shut out": "rare",
  "breakthrough baller": "uncommon",
  "crowd connection": "uncommon",
  "midfield shield": "super_rare",
  "defensive rock": "uncommon",
  "manager career": "uncommon",
  "uefa finals &amp; matchballs": "super_rare",
  "uefa finals": "super_rare",
  "gold rush": "super_rare",
  "purple foil parallel": "rare",
  zen: "legend",
  "artist of the game": "super_rare",
  "stadium stars": "uncommon",
  energy: "uncommon",
  "legendary moment": "legend",
  "cult heroes": "super_rare",
  "next generation": "uncommon",
  "countdown calendar": "uncommon",
  "new signing": "uncommon",
  "white gold": "legend",
  "chrome x pro elite": "super_rare",
  "pitch side": "uncommon",
  "tunnel view": "uncommon",
  "assist maker": "rare",
  "uwcl limelight": "uncommon",
  "mega boost": "super_rare",
  "official matchball": "super_rare",
  "global gamer": "uncommon",
  "emerald parallel": "rare",
  "chrome preview": "rare",
  "exclusive edition": "legend",
  styler: "uncommon",
  stopper: "uncommon",
  warrior: "uncommon",
  enforcer: "uncommon",
  "match winners": "rare",
  "signature style": "legend",
  "super saver": "uncommon",
  "defensive warrior": "rare",
  "midfield masterclass": "rare",
  "goal machine": "rare",
  "all rounders": "uncommon",
  "next gen": "uncommon",
  festive: "uncommon",
  "stars of 2021": "uncommon",
  "uefa final venues": "super_rare",
  "action highlights": "uncommon",
  "position switch": "uncommon",
  "shirt service": "uncommon",
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
