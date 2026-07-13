import { z } from "zod";
import { EXTENSION_BY_MIME } from "@/lib/validation/image.schema";
import type { Card } from "@/lib/types/database.types";

// Pure/testable helpers for the photo-scan add-to-inventory flow
// (app/(main)/inventory/photo-match-actions.ts). Kept out of that file
// because every export of a "use server" file must itself be an async
// Server Action — none of this is.

// Confirmed against Gemini's image-understanding docs: it accepts the same
// jpeg/png/webp/heic/heif set as the general inventory-photo upload, so this
// currently just mirrors EXTENSION_BY_MIME's keys. Kept as its own constant
// (not a direct alias) since the two lists are allowed to diverge — Gemini's
// supported formats, not our storage bucket's, are what should govern this.
export const VISION_SUPPORTED_MIME = new Set(Object.keys(EXTENSION_BY_MIME));

// JSON Schema passed as Gemini's responseSchema (controlled generation) so
// the model's response is guaranteed-parseable JSON, not free text to regex
// apart.
export const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "Player/character full name as printed on the card. Empty string if illegible.",
    },
    team: {
      type: "string",
      description: "Team/club name as printed, or empty string if not visible.",
    },
    setName: {
      type: "string",
      description:
        "Set/series/product name as printed (e.g. 'Match Attax 2024/25'), or empty string if not visible.",
    },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low", "none"],
      description:
        "Confidence this is a legible trading card and the fields above are accurate. Use 'none' if the photo isn't a trading card or no text is legible.",
    },
  },
  required: ["name", "team", "setName", "confidence"],
} as const;

export const EXTRACTION_PROMPT =
  "This is a photo of a physical sports/character trading card. Read the printed text and " +
  "report the player/character name, team, and set/series text you can make out. If the photo " +
  "isn't a trading card, or no text is legible, set confidence to \"none\" and leave the text " +
  "fields empty.";

const ExtractionSchema = z.object({
  name: z.string(),
  team: z.string(),
  setName: z.string(),
  confidence: z.enum(["high", "medium", "low", "none"]),
});

export interface CardExtraction {
  name: string;
  team: string | null;
  setName: string | null;
  confidence: "high" | "medium" | "low" | "none";
}

// Parses + normalizes Gemini's raw JSON response. Returns null if it doesn't
// match the expected shape at all (defense in depth against SDK/model drift
// even though responseSchema should already guarantee this).
export function normalizeExtraction(raw: unknown): CardExtraction | null {
  const parsed = ExtractionSchema.safeParse(raw);
  if (!parsed.success) return null;
  return {
    name: parsed.data.name.trim(),
    team: parsed.data.team.trim() || null,
    setName: parsed.data.setName.trim() || null,
    confidence: parsed.data.confidence,
  };
}

export function shouldSearchCatalog(extraction: CardExtraction): boolean {
  return extraction.confidence !== "none" && extraction.name.length > 0;
}

export type MatchSignal = "name" | "team" | "setName" | "visual";

export function computeMatchedOn(card: Card, extraction: CardExtraction): MatchSignal[] {
  const signals: MatchSignal[] = ["name"];
  if (extraction.team && card.team && card.team.toLowerCase() === extraction.team.toLowerCase()) {
    signals.push("team");
  }
  if (
    extraction.setName &&
    card.set_name &&
    card.set_name.toLowerCase().includes(extraction.setName.toLowerCase())
  ) {
    signals.push("setName");
  }
  return signals;
}

// Visual re-ranking: text search alone can return many equally-plausible
// name matches (e.g. the same player across several sets/rarities). When it
// does, a second Gemini call compares the scanned photo against the
// candidates' own catalog images (referenced by URL, not re-uploaded — see
// photo-match-actions.ts) and picks which one actually looks like the same
// card, so that one can be shown first instead of an arbitrary text-rank tie.

export const VISUAL_MATCH_SCHEMA = {
  type: "object",
  properties: {
    bestMatchNumber: {
      type: "integer",
      description:
        "1-based number of the candidate image that shows the same physical card as the " +
        "photo (same artwork/photo, not just the same player if multiple variants exist). " +
        "0 if none of the candidates plausibly match.",
    },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
      description: "Confidence that bestMatchNumber is correct.",
    },
  },
  required: ["bestMatchNumber", "confidence"],
} as const;

export const VISUAL_MATCH_PROMPT =
  "The first image is a photo of a physical trading card. Each candidate below is a catalog " +
  "image labeled with a number and the card's printed name/team. Identify which numbered " +
  "candidate shows the exact same card as the photo, and report that number. Use 0 if none of " +
  "the candidates plausibly match.";

const VisualMatchSchema = z.object({
  bestMatchNumber: z.number().int(),
  confidence: z.enum(["high", "medium", "low"]),
});

export interface VisualMatch {
  bestMatchNumber: number;
  confidence: "high" | "medium" | "low";
}

export function normalizeVisualMatch(raw: unknown): VisualMatch | null {
  const parsed = VisualMatchSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}

// Reorders `candidates` so the one whose id is `winnerId` is first, leaving
// the rest in their original relative order. Returns `candidates` unchanged
// (including when winnerId is null) if nothing matches — e.g. no confident
// visual match was found, so the original text-ranked order stands.
export function promoteCandidate<T extends { id: string }>(
  candidates: T[],
  winnerId: string | null
): T[] {
  if (!winnerId) return candidates;
  const index = candidates.findIndex((c) => c.id === winnerId);
  if (index === -1) return candidates;
  return [candidates[index], ...candidates.filter((c) => c.id !== winnerId)];
}
