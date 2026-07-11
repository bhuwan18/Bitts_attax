import {
  NormalizedCardSchema,
  RawCardRowSchema,
  normalizeRarity,
  type NormalizedCard,
} from "../../lib/validation/card.schema";
import type { RawCardRecord } from "./adapter";

export interface NormalizeResult {
  cards: NormalizedCard[];
  errors: { index: number; record: RawCardRecord; message: string }[];
}

// Every raw record shape varies by source; RawCardRowSchema coerces
// string-like fields (CSV/scrape output is all strings) before we map onto
// the canonical NormalizedCardSchema. Bad rows are collected, not fatal —
// partial success is acceptable for a seeding tool.
export function normalizeRecords(records: RawCardRecord[], source: string): NormalizeResult {
  const cards: NormalizedCard[] = [];
  const errors: NormalizeResult["errors"] = [];

  records.forEach((record, index) => {
    const rawParsed = RawCardRowSchema.safeParse(record);
    if (!rawParsed.success) {
      errors.push({ index, record, message: rawParsed.error.message });
      return;
    }

    const raw = rawParsed.data;
    const { name, team, position, rarity, ovr_rating, base_price, image_url, set_name, season, external_ref, ...rest } =
      raw;

    const candidate = {
      external_ref: external_ref != null ? String(external_ref) : null,
      source,
      name,
      team: team ?? null,
      position: position ?? null,
      rarity: normalizeRarity(rarity),
      ovr_rating: ovr_rating ?? null,
      base_price: base_price ?? null,
      image_url: image_url && /^https?:\/\//.test(image_url) ? image_url : null,
      set_name: set_name ?? null,
      season: season ?? null,
      attributes: rest,
    };

    const normalized = NormalizedCardSchema.safeParse(candidate);
    if (!normalized.success) {
      errors.push({ index, record, message: normalized.error.message });
      return;
    }

    cards.push(normalized.data);
  });

  return { cards, errors };
}
