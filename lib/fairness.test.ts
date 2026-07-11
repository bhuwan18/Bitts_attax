import { describe, expect, it } from "vitest";
import { computeFairnessScore, type FairnessConfig } from "./fairness";

const config: FairnessConfig = {
  rarityWeights: {
    common: 1,
    uncommon: 1.2,
    rare: 1.5,
    super_rare: 2,
    legend: 3,
    limited: 4,
    other: 1,
  },
  ovrWeight: 0.5,
  priceWeight: 1,
  tolerancePct: 10,
};

describe("computeFairnessScore", () => {
  it("scores an identical trade as perfectly fair", () => {
    const side = [{ basePrice: 10, rarity: "rare" as const, ovrRating: 85, quantity: 1 }];
    const result = computeFairnessScore(side, side, config);

    expect(result.score).toBe(100);
    expect(result.label).toBe("very_fair");
    expect(result.deltaPct).toBe(0);
  });

  it("scores a wildly one-sided trade as very uneven", () => {
    const sideA = [{ basePrice: 50, rarity: "legend" as const, ovrRating: 95, quantity: 3 }];
    const sideB = [{ basePrice: 1, rarity: "common" as const, ovrRating: 60, quantity: 1 }];
    const result = computeFairnessScore(sideA, sideB, config);

    expect(result.score).toBeLessThan(35);
    expect(result.label).toBe("very_uneven");
  });

  it("treats an empty side as having zero value, not a crash", () => {
    const sideA = [{ basePrice: 10, rarity: "common" as const, ovrRating: 80, quantity: 1 }];
    const result = computeFairnessScore(sideA, [], config);

    expect(result.sideB.compositeValue).toBe(0);
    expect(result.deltaPct).toBeGreaterThan(0);
    expect(Number.isFinite(result.score)).toBe(true);
  });

  it("scores a trade within tolerance as roughly 85", () => {
    // sideA composite significantly larger than sideB's price+ovr alone, but
    // sideB's rarity weight (legend=3) closes most of the gap.
    const sideA = [{ basePrice: 20, rarity: "common" as const, ovrRating: 80, quantity: 1 }];
    const sideB = [{ basePrice: 18, rarity: "common" as const, ovrRating: 80, quantity: 1 }];
    const result = computeFairnessScore(sideA, sideB, config);

    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.score).toBeLessThan(100);
  });

  it("lets a rarity-dominant side outweigh a lower price+OVR delta", () => {
    const priceOvrOnly = [{ basePrice: 10, rarity: "common" as const, ovrRating: 80, quantity: 1 }];
    const rarityHeavy = [{ basePrice: 10, rarity: "legend" as const, ovrRating: 80, quantity: 1 }];

    const withoutRarityBoost = computeFairnessScore(priceOvrOnly, priceOvrOnly, config);
    const withRarityBoost = computeFairnessScore(priceOvrOnly, rarityHeavy, config);

    expect(withRarityBoost.score).toBeLessThan(withoutRarityBoost.score);
    expect(withRarityBoost.sideB.rarityScore).toBeGreaterThan(withRarityBoost.sideA.rarityScore);
  });

  it("respects custom config weight overrides", () => {
    const sideA = [{ basePrice: 10, rarity: "common" as const, ovrRating: 99, quantity: 1 }];
    const sideB = [{ basePrice: 10, rarity: "common" as const, ovrRating: 50, quantity: 1 }];

    const lowOvrWeight = computeFairnessScore(sideA, sideB, { ...config, ovrWeight: 0 });
    const highOvrWeight = computeFairnessScore(sideA, sideB, { ...config, ovrWeight: 5 });

    expect(lowOvrWeight.score).toBe(100);
    expect(highOvrWeight.score).toBeLessThan(lowOvrWeight.score);
  });
});
