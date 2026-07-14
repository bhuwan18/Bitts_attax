import { describe, expect, it } from "vitest";
import { resolveFlipDirection } from "./useCardFlip";

/** A tile in the inventory grid is roughly this wide on a phone. */
const WIDTH = 170;
/** Slow enough that the distance rule, not the flick rule, decides. */
const CRAWL = 0.05;

describe("resolveFlipDirection", () => {
  it("returns to the starting face when the swipe is short and slow", () => {
    expect(resolveFlipDirection({ dx: 20, velocity: CRAWL, width: WIDTH })).toBe(0);
    expect(resolveFlipDirection({ dx: -20, velocity: -CRAWL, width: WIDTH })).toBe(0);
  });

  it("completes the flip when the swipe crosses the card, even at a crawl", () => {
    expect(resolveFlipDirection({ dx: 90, velocity: CRAWL, width: WIDTH })).toBe(1);
    expect(resolveFlipDirection({ dx: -90, velocity: -CRAWL, width: WIDTH })).toBe(-1);
  });

  it("completes the flip on a short flick", () => {
    expect(resolveFlipDirection({ dx: 15, velocity: 1.2, width: WIDTH })).toBe(1);
    expect(resolveFlipDirection({ dx: -15, velocity: -1.2, width: WIDTH })).toBe(-1);
  });

  it("abandons the flip when a long drag is flicked back the way it came", () => {
    expect(resolveFlipDirection({ dx: 90, velocity: -1.2, width: WIDTH })).toBe(0);
    expect(resolveFlipDirection({ dx: -90, velocity: 1.2, width: WIDTH })).toBe(0);
  });

  it("scales its thresholds with the card, so the gesture feels the same at any tile size", () => {
    // 60px is past the commit distance on a narrow tile and short of it on a wide one.
    expect(resolveFlipDirection({ dx: 60, velocity: CRAWL, width: 120 })).toBe(1);
    expect(resolveFlipDirection({ dx: 60, velocity: CRAWL, width: 400 })).toBe(0);
  });

  it("stays on the starting face when the gesture is cancelled mid-swipe", () => {
    expect(resolveFlipDirection({ dx: 150, velocity: 1.2, width: WIDTH, cancelled: true })).toBe(0);
  });

  it("does not flip on a tap that never moved", () => {
    expect(resolveFlipDirection({ dx: 0, velocity: 0, width: WIDTH })).toBe(0);
  });
});
