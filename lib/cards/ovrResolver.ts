import type { SupabaseClient } from "@supabase/supabase-js";
import { GEMINI_REQUEST_OPTIONS, getGeminiClient, isRateLimitError } from "@/lib/gemini/client";
import type { Database } from "@/lib/types/database.types";
import {
  OVR_ESTIMATION_MODEL,
  OVR_ESTIMATION_PROMPT,
  OVR_ESTIMATION_SCHEMA,
  describeCard,
  normalizeOvrEstimate,
  selectCardsNeedingEstimate,
  type OvrEstimate,
  type OvrEstimateCandidate,
} from "@/lib/cards/ovrEstimation";

// The impure half of LLM-derived OVR ratings: read the shared cache, call
// Gemini for whatever's missing, write the results back to the cache.
//
// There is exactly ONE caller — computeAndPersistFairness
// (trades/[tradeId]/fairness-actions.ts) — and that's deliberate. A card only
// gets an LLM rating when it's actually put into a trade, i.e. at the one moment
// the missing rating would otherwise corrupt a fairness score. Keep it that way:
// a bulk "rate my whole collection" entry point was considered and rejected,
// because it spends LLM calls on cards nobody is trading, which is unbounded
// cost for no benefit. Anything that walks a list of cards and calls this is
// that same idea wearing a different hat.
//
// This is NOT a "use server" file — it's a plain server-only module, because
// every export of a "use server" file must itself be an async Server Action and
// these are internal helpers, not client-callable endpoints.

// Gemini's rate limit is the binding constraint, not our own throughput, and a
// trade is only ever a handful of cards — so keep the fan-out modest.
const ESTIMATE_CONCURRENCY = 4;

// Hard ceiling per invocation. This used to be 25 — which was *above the entire
// free-tier request allowance* (20 for gemini-3.5-flash). Because
// computeAndPersistFairness() runs on every view of a trade detail page, opening
// one trade full of unrated cards could spend the whole day's quota in a single
// page load and take the photo scanner (same API key) down with it. That is
// exactly what happened.
//
// 8 keeps a single trade view well inside the allowance and leaves headroom for
// the scanner, which is the interactive, user-facing consumer and should win any
// contention with a background scoring nicety. Cards past the cap are simply
// left unrated this run (`remaining` reports them) and get picked up on the next
// view, by which point the earlier ones are cached and cost nothing — the work
// still converges, just without a cliff.
const MAX_ESTIMATES_PER_RUN = 8;

export interface OvrEstimateStats {
  /** Cards that got a fresh LLM rating on this run (billed + newly cached). */
  estimated: number;
  /** Cards already in the shared cache — no LLM call, no cost. */
  cached: number;
  /**
   * Cards the model couldn't rate, that errored, or that were abandoned once the
   * quota ran out mid-run (see estimateOne). All left unrated.
   */
  failed: number;
  /** Cards still needing an estimate because MAX_ESTIMATES_PER_RUN was hit. */
  remaining: number;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  });

  await Promise.all(workers);
  return results;
}

/** Shared across one resolveOvrRatings() fan-out, so the workers can call it off. */
interface RunState {
  quotaExhausted: boolean;
}

// One Gemini call for one card. Image-first: the card's catalog art is passed
// by URL (Gemini fetches it directly — no server-side download/re-upload), since
// these cards print the OVR on the face and reading it beats guessing at it.
// With no image, the model falls back to knowledge-based estimation.
//
// Returns null on ANY failure — API error, timeout, rate limit, malformed
// JSON, or the model reporting that it can't rate the card. Every one of those
// means the same thing to the caller ("no estimate for this card, leave it
// unrated"), and none of them may be allowed to take down the trade the user is
// actually trying to look at.
//
// A 429 is the one failure that says something about the *next* card as well as
// this one: the quota is gone for the rest of this run, so every remaining call
// is a guaranteed failure that still costs a retry, a backoff, and another
// request against an allowance we've already blown. So the first 429 trips
// `state` and the rest of the batch short-circuits without touching the network.
async function estimateOne(
  card: OvrEstimateCandidate,
  state: RunState
): Promise<OvrEstimate | null> {
  if (state.quotaExhausted) return null;

  const imageUrl = card.image_url;

  try {
    const gemini = getGeminiClient();
    const interaction = await gemini.interactions.create({
      model: OVR_ESTIMATION_MODEL,
      input: [
        { type: "text", text: OVR_ESTIMATION_PROMPT },
        { type: "text", text: describeCard(card) },
        ...(imageUrl
          ? ([{ type: "image", uri: imageUrl }] as const)
          : ([{ type: "text", text: "No card image is available." }] as const)),
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: OVR_ESTIMATION_SCHEMA,
      },
    }, GEMINI_REQUEST_OPTIONS);

    if (!interaction.output_text) return null;
    return normalizeOvrEstimate(JSON.parse(interaction.output_text));
  } catch (err) {
    if (isRateLimitError(err)) {
      state.quotaExhausted = true;
      console.error(
        `estimateOne: Gemini quota exhausted at card ${card.id} — abandoning the rest of this batch`,
        err
      );
      return null;
    }
    console.error(`estimateOne: Gemini call failed for card ${card.id}`, err);
    return null;
  }
}

// Resolves an OVR rating for every card that has one, filling gaps via the LLM.
//
// Returns a map of card_id -> rating containing ONLY cards that ended up with a
// usable rating: cards already rated in the catalog are absent (callers already
// have that value), and cards that couldn't be estimated are absent too, so an
// absent id unambiguously means "still unrated".
//
// Never throws. A Gemini outage degrades this to "no new estimates", which is
// exactly the behavior the app had before this feature existed.
export async function resolveOvrRatings(
  supabase: SupabaseClient<Database>,
  userId: string,
  cards: OvrEstimateCandidate[]
): Promise<{ ratings: Map<string, number>; stats: OvrEstimateStats }> {
  const ratings = new Map<string, number>();
  const unrated = cards.filter((card) => card.ovr_rating === null);

  if (unrated.length === 0) {
    return { ratings, stats: { estimated: 0, cached: 0, failed: 0, remaining: 0 } };
  }

  // Warm path: whatever another user (or an earlier trade) already paid for.
  const { data: cachedRows, error: cacheError } = await supabase
    .from("card_ovr_estimates")
    .select("card_id, ovr_rating")
    .in(
      "card_id",
      unrated.map((card) => card.id)
    );

  if (cacheError) {
    // A cache read failure shouldn't block scoring — fall through with an empty
    // cache. Worst case we re-estimate a card that was already estimated, and
    // the unique(card_id) upsert below discards the duplicate.
    console.error("resolveOvrRatings: estimate cache read failed", cacheError);
  }

  for (const row of cachedRows ?? []) {
    ratings.set(row.card_id, row.ovr_rating);
  }

  const missing = selectCardsNeedingEstimate(unrated, new Set(ratings.keys()));
  const batch = missing.slice(0, MAX_ESTIMATES_PER_RUN);

  const state: RunState = { quotaExhausted: false };
  const estimates = await mapWithConcurrency(batch, ESTIMATE_CONCURRENCY, (card) =>
    estimateOne(card, state)
  );

  const rows = batch
    .map((card, i) => ({ card, estimate: estimates[i] }))
    .filter((entry): entry is { card: OvrEstimateCandidate; estimate: OvrEstimate } => !!entry.estimate)
    .map(({ card, estimate }) => ({
      card_id: card.id,
      ovr_rating: estimate.ovrRating,
      source: estimate.source,
      confidence: estimate.confidence,
      model: OVR_ESTIMATION_MODEL,
      created_by: userId,
    }));

  if (rows.length > 0) {
    // ignoreDuplicates: two users can propose trades containing the same
    // unrated card at the same time and both race to insert an estimate for it.
    // unique(card_id) makes that a conflict rather than a duplicate row; the
    // loser just keeps whichever estimate landed first, which is fine — they're
    // interchangeable, and the alternative (throwing) would fail a trade score
    // over a harmless race.
    const { error: insertError } = await supabase
      .from("card_ovr_estimates")
      .upsert(rows, { onConflict: "card_id", ignoreDuplicates: true });

    if (insertError) {
      // The estimates are still usable for THIS request even if caching them
      // failed; they just won't be free next time.
      console.error("resolveOvrRatings: failed to cache estimates", insertError);
    }

    for (const row of rows) {
      ratings.set(row.card_id, row.ovr_rating);
    }
  }

  return {
    ratings,
    stats: {
      estimated: rows.length,
      cached: cachedRows?.length ?? 0,
      failed: batch.length - rows.length,
      remaining: Math.max(0, missing.length - batch.length),
    },
  };
}
