import type { Rarity } from "@/lib/types/database.types";

export interface FairnessInputCard {
  basePrice: number;
  rarity: Rarity;
  ovrRating: number;
  quantity: number;
}

export type FairnessSideInput = FairnessInputCard[];

export interface FairnessConfig {
  rarityWeights: Record<Rarity, number>;
  ovrWeight: number;
  priceWeight: number;
  tolerancePct: number;
}

export type FairnessLabel =
  | "very_fair"
  | "fair"
  | "slightly_uneven"
  | "uneven"
  | "very_uneven";

export interface FairnessSideBreakdown {
  priceTotal: number;
  rarityScore: number;
  ovrTotal: number;
  compositeValue: number;
}

export interface FairnessResult {
  score: number;
  label: FairnessLabel;
  sideA: FairnessSideBreakdown;
  sideB: FairnessSideBreakdown;
  deltaPct: number;
}

// Normalizes rarity's contribution to be roughly the same order of magnitude
// as price so neither dominates the composite value by unit choice alone.
// Approximates "average card price / 10" for a typical catalog — retune if
// your card set's price distribution differs substantially.
const RARITY_NORMALIZATION_CONSTANT = 5;

// score = 100 - deltaPct * scalingFactor, where scalingFactor is derived so
// that a delta exactly at the configured tolerance still scores ~85 (inside
// tolerance is "fair", not necessarily perfect — only 0% delta is 100).
const SCORE_AT_TOLERANCE = 85;

function computeSide(side: FairnessSideInput, config: FairnessConfig): FairnessSideBreakdown {
  let priceTotal = 0;
  let rarityScore = 0;
  let ovrTotal = 0;

  for (const item of side) {
    priceTotal += item.basePrice * item.quantity;
    rarityScore += (config.rarityWeights[item.rarity] ?? 1) * item.quantity;
    ovrTotal += item.ovrRating * item.quantity;
  }

  const compositeValue =
    priceTotal * config.priceWeight +
    rarityScore * config.priceWeight * RARITY_NORMALIZATION_CONSTANT +
    ovrTotal * config.ovrWeight;

  return { priceTotal, rarityScore, ovrTotal, compositeValue };
}

function labelForScore(score: number): FairnessLabel {
  if (score >= 90) return "very_fair";
  if (score >= 75) return "fair";
  if (score >= 55) return "slightly_uneven";
  if (score >= 35) return "uneven";
  return "very_uneven";
}

export function computeFairnessScore(
  sideA: FairnessSideInput,
  sideB: FairnessSideInput,
  config: FairnessConfig
): FairnessResult {
  const breakdownA = computeSide(sideA, config);
  const breakdownB = computeSide(sideB, config);

  const epsilon = 1e-9;
  const larger = Math.max(breakdownA.compositeValue, breakdownB.compositeValue, epsilon);
  const deltaPct =
    (Math.abs(breakdownA.compositeValue - breakdownB.compositeValue) / larger) * 100;

  const scalingFactor = (100 - SCORE_AT_TOLERANCE) / Math.max(config.tolerancePct, epsilon);
  const score = Math.max(0, Math.min(100, 100 - deltaPct * scalingFactor));

  return {
    score,
    label: labelForScore(score),
    sideA: breakdownA,
    sideB: breakdownB,
    deltaPct,
  };
}
