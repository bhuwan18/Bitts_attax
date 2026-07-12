import { describe, expect, it } from "vitest";
import { computeLevel, computeXpPercent } from "./level";

describe("computeLevel", () => {
  it("starts at level 1 with zero cards", () => {
    expect(computeLevel(0)).toBe(1);
  });

  it("levels up every 4 unique cards", () => {
    expect(computeLevel(3)).toBe(1);
    expect(computeLevel(4)).toBe(2);
    expect(computeLevel(8)).toBe(3);
  });
});

describe("computeXpPercent", () => {
  it("starts at 10% with zero cards, not an empty bar", () => {
    expect(computeXpPercent(0)).toBe(10);
  });

  it("fills toward 100% within a level then wraps on level-up", () => {
    expect(computeXpPercent(3)).toBe(85);
    expect(computeXpPercent(4)).toBe(10);
  });

  it("never exceeds 100", () => {
    expect(computeXpPercent(3)).toBeLessThanOrEqual(100);
  });
});
