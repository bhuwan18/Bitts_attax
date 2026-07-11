import { describe, expect, it } from "vitest";
import { CARDS_PAGE_SIZE, getNextCardsPageParam, type CardListItem } from "./cardsShared";

function makeCards(count: number): CardListItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `card-${i}`,
    name: `Card ${i}`,
    team: "Team",
    rarity: "common",
    ovr_rating: 80,
    base_price: 1,
    image_url: null,
  }));
}

describe("getNextCardsPageParam", () => {
  it("returns the next page index when a full page comes back", () => {
    const fullPage = makeCards(CARDS_PAGE_SIZE);
    expect(getNextCardsPageParam(fullPage, [fullPage])).toBe(1);
  });

  it("returns undefined when the page is shorter than the page size", () => {
    const shortPage = makeCards(CARDS_PAGE_SIZE - 1);
    expect(getNextCardsPageParam(shortPage, [shortPage])).toBeUndefined();
  });

  it("returns undefined for an empty page", () => {
    expect(getNextCardsPageParam([], [[]])).toBeUndefined();
  });
});
