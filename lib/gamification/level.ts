// Derived, not stored — a pure function of a single already-available count
// (unique cards owned), matching how the rest of the app treats aggregate
// stats (e.g. useTraderHavesCounts() counts inventory_items rows live rather
// than reading a maintained counter column). Avoids a stored value silently
// drifting from reality after e.g. an inventory item is deleted.
export function computeLevel(uniqueCardsOwned: number): number {
  return Math.max(1, Math.floor(uniqueCardsOwned / 4) + 1);
}

export function computeXpPercent(uniqueCardsOwned: number): number {
  return Math.min(100, (uniqueCardsOwned % 4) * 25 + 10);
}
