import { z } from "zod";
import type { Card } from "@/lib/types/database.types";

// Pure/testable helpers for LLM-derived OVR ratings (migration
// 0018_card_ovr_estimates.sql). The impure half — cache lookup, Gemini call,
// persistence — lives in lib/cards/ovrResolver.ts; this file is only prompt,
// schema, and normalization, mirroring how photoExtraction.ts splits away from
// photo-match-actions.ts.

// Same model the photo-scan flow uses. Recorded on every stored estimate
// (card_ovr_estimates.model) so a future upgrade can find and re-run whatever
// an older model produced.
export const OVR_ESTIMATION_MODEL = "gemini-3.5-flash";

// The model reports 0 to mean "I cannot determine or reasonably estimate
// this". 0 is inside the column's 0..99 check constraint but no real card is
// rated 0, so it works as an out-of-band sentinel without widening the schema
// to a nullable integer. normalizeOvrEstimate() rejects it, and nothing below
// UNKNOWN_OVR is ever persisted.
export const UNKNOWN_OVR = 0;

export const OVR_ESTIMATION_SCHEMA = {
  type: "object",
  properties: {
    ovrRating: {
      type: "integer",
      description:
        "The card's overall (OVR) rating, 0-99. If the rating is printed on the card image, " +
        "report exactly that printed number. Otherwise estimate it from the player's real-world " +
        "ability in that season. Use 0 — and only 0 — if you cannot determine or reasonably " +
        "estimate a rating.",
    },
    readFromCard: {
      type: "boolean",
      description:
        "True only if you actually read the number off the card image. False if you estimated " +
        "it from what you know about the player, including when an image was provided but its " +
        "rating was absent or illegible.",
    },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
      description:
        "Confidence that ovrRating is correct. Use 'high' only when the number was legibly " +
        "printed on the card.",
    },
  },
  required: ["ovrRating", "readFromCard", "confidence"],
} as const;

// Image-first, knowledge-second. Match Attax-style cards print the OVR on the
// card face, so when there's an image the right answer is transcription, not
// inference — and the prompt has to say so explicitly, or the model will
// happily "estimate" a number that's sitting right there in the picture.
export const OVR_ESTIMATION_PROMPT =
  "You are rating a football (soccer) trading card. Its OVR is an overall rating from 0-99, " +
  "usually printed on the front of the card.\n\n" +
  "If a card image is provided: read the OVR printed on it and report that exact number, with " +
  "readFromCard=true.\n" +
  "If no image is provided, or the printed rating is absent or illegible: estimate the rating " +
  "from what you know of this player's real-world ability in the relevant season, and set " +
  "readFromCard=false. Judge the player, not the card's rarity — a rare card of an average " +
  "player is still an average player.\n" +
  "If you cannot do either, report ovrRating=0.";

const OvrEstimationSchema = z.object({
  ovrRating: z.number().int(),
  readFromCard: z.boolean(),
  confidence: z.enum(["high", "medium", "low"]),
});

// 'image' means the number was transcribed off the card face; 'knowledge'
// means it was inferred from the player. Persisted to card_ovr_estimates.source
// so the two are never conflated after the fact.
export type OvrEstimateSource = "image" | "knowledge";

export interface OvrEstimate {
  ovrRating: number;
  source: OvrEstimateSource;
  confidence: "high" | "medium" | "low";
}

// Parses + normalizes Gemini's raw JSON. Returns null when the response is
// unusable — either it didn't match the expected shape at all (defense in
// depth against SDK/model drift, even though responseSchema should already
// guarantee it), or the model reported UNKNOWN_OVR / an out-of-range number.
// A null here means "no estimate", which callers must treat as "leave the card
// unrated", never as "rate it 0".
export function normalizeOvrEstimate(raw: unknown): OvrEstimate | null {
  const parsed = OvrEstimationSchema.safeParse(raw);
  if (!parsed.success) return null;

  const { ovrRating, readFromCard, confidence } = parsed.data;
  if (ovrRating <= UNKNOWN_OVR || ovrRating > 99) return null;

  return {
    ovrRating,
    source: readFromCard ? "image" : "knowledge",
    // A rating the model only inferred cannot be 'high' confidence no matter
    // what it claims — the prompt reserves 'high' for a number legibly printed
    // on the card, and this enforces that rather than trusting it.
    confidence: readFromCard ? confidence : confidence === "high" ? "medium" : confidence,
  };
}

// The text half of the prompt input: everything the catalog knows about the
// card, so the model can identify the player even when there's no image (and
// can sanity-check the printed number against the player when there is one).
export function describeCard(card: OvrEstimateCandidate): string {
  const fields: Array<[string, string | null]> = [
    ["Name", card.name],
    ["Team", card.team],
    ["Position", card.position],
    ["Set", card.set_name],
    ["Season", card.season],
    ["Rarity", card.rarity],
  ];
  return fields
    .filter((entry): entry is [string, string] => !!entry[1])
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

// The subset of a card the estimator actually needs. Narrower than Card so
// callers can pass a partial select without casting.
export type OvrEstimateCandidate = Pick<
  Card,
  "id" | "name" | "team" | "position" | "rarity" | "set_name" | "season" | "image_url" | "ovr_rating"
>;

// Which cards still need an LLM call: unrated in the catalog AND not already
// in the shared estimate cache. Pure so the "do we even need to spend money"
// decision is testable on its own — the resolver's whole cost story depends on
// this returning [] on the warm path.
export function selectCardsNeedingEstimate<T extends { id: string; ovr_rating: number | null }>(
  cards: T[],
  cachedCardIds: ReadonlySet<string>
): T[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    if (card.ovr_rating !== null) return false;
    if (cachedCardIds.has(card.id)) return false;
    // The same card can appear more than once across a trade's two sides or a
    // portfolio; dedupe so it's estimated (and billed) once.
    if (seen.has(card.id)) return false;
    seen.add(card.id);
    return true;
  });
}

// Folds the canonical rating and the estimate into the single number the rest
// of the app reads, matching the cards_effective view's coalesce. Canonical
// always wins — an estimate exists only where the catalog had nothing.
export function effectiveOvr(
  canonical: number | null,
  estimate: number | null | undefined
): number | null {
  return canonical ?? estimate ?? null;
}
