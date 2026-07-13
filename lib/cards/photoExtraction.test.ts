import { describe, expect, it } from "vitest";
import {
  computeMatchedOn,
  normalizeExtraction,
  normalizeVisualMatch,
  promoteCandidate,
  shouldSearchCatalog,
  type CardExtraction,
} from "./photoExtraction";
import type { Card } from "@/lib/types/database.types";

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "card-1",
    external_ref: null,
    source: "manual",
    name: "Test Card",
    team: "Test FC",
    position: null,
    rarity: "common",
    ovr_rating: 80,
    base_price: 1,
    image_url: null,
    set_name: "Test Set 2026",
    season: null,
    attributes: {},
    owned_count: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("normalizeExtraction", () => {
  it("trims strings and converts empty fields to null", () => {
    const result = normalizeExtraction({
      name: "  Erling Haaland  ",
      team: "  ",
      setName: "",
      confidence: "high",
    });

    expect(result).toEqual({
      name: "Erling Haaland",
      team: null,
      setName: null,
      confidence: "high",
    });
  });

  it("returns null for malformed input", () => {
    expect(normalizeExtraction({ name: "X" })).toBeNull();
    expect(normalizeExtraction(null)).toBeNull();
    expect(normalizeExtraction("not an object")).toBeNull();
  });
});

describe("shouldSearchCatalog", () => {
  it("is false when confidence is none", () => {
    const extraction: CardExtraction = { name: "Someone", team: null, setName: null, confidence: "none" };
    expect(shouldSearchCatalog(extraction)).toBe(false);
  });

  it("is false when name is empty, even with non-none confidence", () => {
    const extraction: CardExtraction = { name: "", team: "A Team", setName: null, confidence: "low" };
    expect(shouldSearchCatalog(extraction)).toBe(false);
  });

  it("is true when confidence is not none and name is present", () => {
    const extraction: CardExtraction = { name: "Someone", team: null, setName: null, confidence: "low" };
    expect(shouldSearchCatalog(extraction)).toBe(true);
  });
});

describe("computeMatchedOn", () => {
  it("always includes name", () => {
    const card = makeCard({ team: null, set_name: null });
    const extraction: CardExtraction = { name: "Test Card", team: null, setName: null, confidence: "high" };
    expect(computeMatchedOn(card, extraction)).toEqual(["name"]);
  });

  it("adds team on a case-insensitive match", () => {
    const card = makeCard({ team: "Test FC" });
    const extraction: CardExtraction = { name: "Test Card", team: "test fc", setName: null, confidence: "high" };
    expect(computeMatchedOn(card, extraction)).toEqual(["name", "team"]);
  });

  it("adds setName on a case-insensitive substring match", () => {
    const card = makeCard({ set_name: "Test Set 2026" });
    const extraction: CardExtraction = { name: "Test Card", team: null, setName: "test set", confidence: "high" };
    expect(computeMatchedOn(card, extraction)).toEqual(["name", "setName"]);
  });

  it("does not add a signal when the values disagree", () => {
    const card = makeCard({ team: "Test FC", set_name: "Test Set 2026" });
    const extraction: CardExtraction = {
      name: "Test Card",
      team: "Different FC",
      setName: "Different Set",
      confidence: "high",
    };
    expect(computeMatchedOn(card, extraction)).toEqual(["name"]);
  });
});

describe("normalizeVisualMatch", () => {
  it("parses a valid response", () => {
    expect(normalizeVisualMatch({ bestMatchNumber: 3, confidence: "high" })).toEqual({
      bestMatchNumber: 3,
      confidence: "high",
    });
  });

  it("returns null for malformed input", () => {
    expect(normalizeVisualMatch({ bestMatchNumber: "3" })).toBeNull();
    expect(normalizeVisualMatch(null)).toBeNull();
    expect(normalizeVisualMatch({ confidence: "high" })).toBeNull();
  });
});

describe("promoteCandidate", () => {
  const candidates = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("moves the matching id to the front, preserving the rest's order", () => {
    expect(promoteCandidate(candidates, "b")).toEqual([{ id: "b" }, { id: "a" }, { id: "c" }]);
  });

  it("is a no-op when the winner is already first", () => {
    expect(promoteCandidate(candidates, "a")).toEqual(candidates);
  });

  it("returns the original order unchanged when winnerId is null", () => {
    expect(promoteCandidate(candidates, null)).toEqual(candidates);
  });

  it("returns the original order unchanged when winnerId isn't found", () => {
    expect(promoteCandidate(candidates, "nonexistent")).toEqual(candidates);
  });
});
