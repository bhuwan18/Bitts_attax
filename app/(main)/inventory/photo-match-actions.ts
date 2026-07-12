"use server";

import { createClient } from "@/lib/supabase/server";
import { getGeminiClient } from "@/lib/gemini/client";
import { ImageFileSchema } from "@/lib/validation/image.schema";
import {
  EXTRACTION_PROMPT,
  EXTRACTION_SCHEMA,
  VISION_SUPPORTED_MIME,
  computeMatchedOn,
  normalizeExtraction,
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

// Reads the physical card in `image` via Gemini vision, then fuzzy-searches
// the `cards` catalog (match_cards_by_text RPC, 0017_match_cards_by_text.sql)
// for the closest text matches. Read-only — it never touches inventory_items;
// the actual add still goes through the existing addToInventory action
// (app/(main)/inventory/actions.ts), called from the UI once the user picks
// one of the candidates returned here, reusing this same photo.
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
    match_count: 5,
  });
  if (error) throw new Error(error.message);

  if (!data || data.length === 0) {
    return { status: "no_matches", extraction, candidates: [] };
  }

  return {
    status: "matched",
    extraction,
    candidates: data.map((card) => ({ card, matchedOn: computeMatchedOn(card, extraction) })),
  };
}
