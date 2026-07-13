import { describe, expect, it } from "vitest";
import {
  UNKNOWN_OVR,
  describeCard,
  effectiveOvr,
  normalizeOvrEstimate,
  selectCardsNeedingEstimate,
  type OvrEstimateCandidate,
} from "./ovrEstimation";

function makeCandidate(overrides: Partial<OvrEstimateCandidate> = {}): OvrEstimateCandidate {
  return {
    id: "card-1",
    name: "Test Player",
    team: "Test FC",
    position: "MID",
    rarity: "rare",
    set_name: "Test Set 2026",
    season: "2025/26",
    image_url: null,
    ovr_rating: null,
    ...overrides,
  };
}

function makeResponse(overrides: Record<string, unknown> = {}) {
  return { ovrRating: 84, readFromCard: true, confidence: "high", ...overrides };
}

describe("normalizeOvrEstimate", () => {
  it("maps readFromCard to the 'image' source", () => {
    expect(normalizeOvrEstimate(makeResponse())).toEqual({
      ovrRating: 84,
      source: "image",
      confidence: "high",
    });
  });

  it("maps an inferred rating to the 'knowledge' source", () => {
    expect(normalizeOvrEstimate(makeResponse({ readFromCard: false, confidence: "medium" }))).toEqual(
      { ovrRating: 84, source: "knowledge", confidence: "medium" }
    );
  });

  // The prompt reserves "high" for a number legibly printed on the card, but a
  // model that ignores that and claims high confidence on a pure guess must not
  // be taken at its word — otherwise a guessed rating is indistinguishable from
  // a transcribed one in the stored data.
  it("caps a knowledge-based estimate's confidence at medium", () => {
    expect(normalizeOvrEstimate(makeResponse({ readFromCard: false, confidence: "high" }))).toEqual({
      ovrRating: 84,
      source: "knowledge",
      confidence: "medium",
    });
  });

  it("preserves low confidence on a knowledge-based estimate", () => {
    expect(normalizeOvrEstimate(makeResponse({ readFromCard: false, confidence: "low" }))?.confidence).toBe(
      "low"
    );
  });

  // UNKNOWN_OVR is the model's "I can't rate this" sentinel. Returning it as a
  // rating of 0 would be worse than returning nothing: fairness would score the
  // card as worthless, which is the exact bug this feature exists to fix.
  it("rejects the unknown sentinel rather than treating it as a rating of 0", () => {
    expect(normalizeOvrEstimate(makeResponse({ ovrRating: UNKNOWN_OVR }))).toBeNull();
  });

  it("rejects out-of-range ratings", () => {
    expect(normalizeOvrEstimate(makeResponse({ ovrRating: 100 }))).toBeNull();
    expect(normalizeOvrEstimate(makeResponse({ ovrRating: -5 }))).toBeNull();
  });

  it("returns null for a malformed response", () => {
    expect(normalizeOvrEstimate({ ovrRating: "84" })).toBeNull();
    expect(normalizeOvrEstimate(null)).toBeNull();
    expect(normalizeOvrEstimate({})).toBeNull();
  });
});

describe("selectCardsNeedingEstimate", () => {
  it("skips cards the catalog already rates", () => {
    const cards = [
      makeCandidate({ id: "rated", ovr_rating: 88 }),
      makeCandidate({ id: "unrated", ovr_rating: null }),
    ];
    expect(selectCardsNeedingEstimate(cards, new Set()).map((c) => c.id)).toEqual(["unrated"]);
  });

  // The whole cost story depends on this: a card someone already estimated must
  // never trigger a second Gemini call.
  it("skips cards already in the shared estimate cache", () => {
    const cards = [makeCandidate({ id: "cached" }), makeCandidate({ id: "fresh" })];
    expect(selectCardsNeedingEstimate(cards, new Set(["cached"])).map((c) => c.id)).toEqual([
      "fresh",
    ]);
  });

  it("dedupes a card that appears more than once", () => {
    const cards = [makeCandidate({ id: "dupe" }), makeCandidate({ id: "dupe" })];
    expect(selectCardsNeedingEstimate(cards, new Set())).toHaveLength(1);
  });

  it("returns nothing when everything is already rated or cached", () => {
    const cards = [
      makeCandidate({ id: "rated", ovr_rating: 70 }),
      makeCandidate({ id: "cached" }),
    ];
    expect(selectCardsNeedingEstimate(cards, new Set(["cached"]))).toEqual([]);
  });
});

describe("effectiveOvr", () => {
  it("prefers the canonical rating over an estimate", () => {
    expect(effectiveOvr(90, 70)).toBe(90);
  });

  it("falls back to the estimate when the catalog has no rating", () => {
    expect(effectiveOvr(null, 70)).toBe(70);
  });

  it("stays null when neither exists", () => {
    expect(effectiveOvr(null, null)).toBeNull();
    expect(effectiveOvr(null, undefined)).toBeNull();
  });
});

describe("describeCard", () => {
  it("omits fields the catalog doesn't have", () => {
    const described = describeCard(makeCandidate({ team: null, season: null }));
    expect(described).toContain("Name: Test Player");
    expect(described).not.toContain("Team:");
    expect(described).not.toContain("Season:");
  });
});
