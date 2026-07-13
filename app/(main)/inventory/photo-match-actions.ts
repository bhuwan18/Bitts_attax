"use server";

import { createClient } from "@/lib/supabase/server";
import { getGeminiClient } from "@/lib/gemini/client";
import { ImageFileSchema } from "@/lib/validation/image.schema";
import {
  EXTRACTION_PROMPT,
  EXTRACTION_SCHEMA,
  VISION_SUPPORTED_MIME,
  VISUAL_MATCH_PROMPT,
  VISUAL_MATCH_SCHEMA,
  computeMatchedOn,
  normalizeExtraction,
  normalizeVisualMatch,
  promoteCandidate,
  shouldSearchCatalog,
  type CardExtraction,
  type MatchSignal,
} from "@/lib/cards/photoExtraction";
import type { Card } from "@/lib/types/database.types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in.");
  return { supabase, user };
}

export type PhotoScanStatus =
  | "matched"
  | "no_text"
  | "no_matches"
  | "unsupported_type"
  | "extraction_failed";

export interface PhotoMatchCandidate {
  card: Card;
  matchedOn: MatchSignal[];
}

export interface PhotoScanResult {
  status: PhotoScanStatus;
  extraction: CardExtraction | null;
  candidates: PhotoMatchCandidate[];
}

// A broader pool than what's actually shown, so there's something to
// visually re-rank when the text match is ambiguous (e.g. the same player
// across many sets/rarities) rather than just the first 5 alphabetical-ish
// ties.
const TEXT_MATCH_POOL_SIZE = 15;
// Only worth the extra Gemini call when the text match didn't already narrow
// things down to (at most) a screen's worth of obviously-relevant options.
const VISUAL_RERANK_THRESHOLD = 5;
const FINAL_CANDIDATE_COUNT = 5;

// Compares the scanned photo against the text-matched candidates' own
// catalog images (referenced by URL — Gemini fetches them directly, no
// server-side download/re-upload needed) and returns the id of whichever one
// visually looks like the same card, or null if nothing came back
// confidently (including any Gemini error — this is a best-effort re-rank,
// never a hard dependency).
async function findVisualMatch(
  base64: string,
  mimeType: string,
  candidates: Card[]
): Promise<string | null> {
  const withImages = candidates.filter(
    (card): card is Card & { image_url: string } => !!card.image_url
  );
  if (withImages.length === 0) return null;

  try {
    const gemini = getGeminiClient();
    const interaction = await gemini.interactions.create({
      model: "gemini-3.5-flash",
      input: [
        { type: "text", text: VISUAL_MATCH_PROMPT },
        { type: "text", text: "Photo of the physical card:" },
        { type: "image", data: base64, mime_type: mimeType },
        ...withImages.flatMap((card, i) => [
          { type: "text" as const, text: `Candidate ${i + 1}: ${card.name}${card.team ? ` (${card.team})` : ""}` },
          { type: "image" as const, uri: card.image_url },
        ]),
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: VISUAL_MATCH_SCHEMA,
      },
    });
    if (!interaction.output_text) return null;

    const visualMatch = normalizeVisualMatch(JSON.parse(interaction.output_text));
    if (!visualMatch || visualMatch.bestMatchNumber < 1) return null;

    return withImages[visualMatch.bestMatchNumber - 1]?.id ?? null;
  } catch (err) {
    console.error("scanCardPhoto: visual re-rank failed, keeping text-ranked order", err);
    return null;
  }
}

// Reads the physical card in `image` via Gemini vision, then fuzzy-searches
// the `cards` catalog (match_cards_by_text RPC, 0017_match_cards_by_text.sql)
// for the closest text matches. When that text match is ambiguous (more than
// VISUAL_RERANK_THRESHOLD results), a second Gemini call visually compares
// the photo against the candidates' catalog images and promotes whichever
// one actually looks right to the front. Read-only — it never touches
// inventory_items; the actual add still goes through the existing
// addToInventory action (app/(main)/inventory/actions.ts), called from the
// UI once the user picks one of the candidates returned here, reusing this
// same photo.
export async function scanCardPhoto(image: File): Promise<PhotoScanResult> {
  const parsedImage = ImageFileSchema.parse(image);
  const { supabase } = await requireUser();

  if (!VISION_SUPPORTED_MIME.has(parsedImage.type)) {
    return { status: "unsupported_type", extraction: null, candidates: [] };
  }

  const base64 = Buffer.from(await parsedImage.arrayBuffer()).toString("base64");

  let extraction: CardExtraction | null;
  try {
    const gemini = getGeminiClient();
    const interaction = await gemini.interactions.create({
      model: "gemini-3.5-flash",
      input: [
        { type: "text", text: EXTRACTION_PROMPT },
        { type: "image", data: base64, mime_type: parsedImage.type },
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: EXTRACTION_SCHEMA,
      },
    });
    if (!interaction.output_text) throw new Error("Gemini returned no output.");
    extraction = normalizeExtraction(JSON.parse(interaction.output_text));
  } catch (err) {
    // Gemini API error, timeout, rate limit (including free-tier quota
    // exhaustion), or malformed JSON all collapse to one status — the
    // dialog's "Search manually" fallback covers every one of them the same
    // way, so there's no value in distinguishing them for the caller.
    console.error("scanCardPhoto: Gemini call failed", err);
    extraction = null;
  }

  if (!extraction) {
    return { status: "extraction_failed", extraction: null, candidates: [] };
  }
  if (!shouldSearchCatalog(extraction)) {
    return { status: "no_text", extraction, candidates: [] };
  }

  const { data, error } = await supabase.rpc("match_cards_by_text", {
    p_name: extraction.name,
    p_team: extraction.team,
    p_set_name: extraction.setName,
    match_count: TEXT_MATCH_POOL_SIZE,
  });
  if (error) throw new Error(error.message);

  if (!data || data.length === 0) {
    return { status: "no_matches", extraction, candidates: [] };
  }

  let visualMatchId: string | null = null;
  if (data.length > VISUAL_RERANK_THRESHOLD) {
    visualMatchId = await findVisualMatch(base64, parsedImage.type, data);
  }

  const orderedCards = promoteCandidate(data, visualMatchId);

  return {
    status: "matched",
    extraction,
    candidates: orderedCards.slice(0, FINAL_CANDIDATE_COUNT).map((card) => ({
      card,
      matchedOn:
        card.id === visualMatchId
          ? [...computeMatchedOn(card, extraction), "visual" as const]
          : computeMatchedOn(card, extraction),
    })),
  };
}
