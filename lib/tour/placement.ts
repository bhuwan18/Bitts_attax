// Pure geometry for the tour tooltip: given the spotlighted element's rect, the
// tooltip card's measured size, and the viewport, decide which side to sit on
// and where — clamped so the card always stays fully on screen. Kept free of DOM
// so it's unit-testable (see placement.test.ts), mirroring lib/fairness.ts.

export interface RectLike {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export type Side = "top" | "bottom" | "left" | "right";
export type PreferredSide = Side | "auto";

export interface Placement {
  top: number;
  left: number;
  side: Side;
}

// Gap between the target and the card, and the minimum distance the card keeps
// from any viewport edge.
const GAP = 12;
const MARGIN = 12;

export function chooseSide(target: RectLike, card: Size, viewport: Viewport): Side {
  const space: Record<Side, number> = {
    bottom: viewport.height - (target.top + target.height),
    top: target.top,
    right: viewport.width - (target.left + target.width),
    left: target.left,
  };
  const need: Record<Side, number> = {
    bottom: card.height + GAP,
    top: card.height + GAP,
    right: card.width + GAP,
    left: card.width + GAP,
  };
  // Prefer below, then above, then to the sides — the natural reading order for
  // a tooltip on a mostly-vertical mobile layout.
  const order: Side[] = ["bottom", "top", "right", "left"];
  for (const side of order) {
    if (space[side] >= need[side]) return side;
  }
  // Nothing fits cleanly (small viewport / large target) — pick the roomiest.
  return order.reduce((best, side) => (space[side] > space[best] ? side : best), order[0]);
}

function clamp(value: number, min: number, max: number): number {
  // When the card is wider/taller than the available run, `max` falls below
  // `min`; pin to `min` (top/left edge) rather than returning a negative range.
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

export function computePlacement(
  target: RectLike,
  card: Size,
  viewport: Viewport,
  preferred: PreferredSide = "auto"
): Placement {
  const side = preferred === "auto" ? chooseSide(target, card, viewport) : preferred;

  const alignedX = target.left + target.width / 2 - card.width / 2;
  const alignedY = target.top + target.height / 2 - card.height / 2;

  let top = 0;
  let left = 0;
  switch (side) {
    case "bottom":
      top = target.top + target.height + GAP;
      left = alignedX;
      break;
    case "top":
      top = target.top - card.height - GAP;
      left = alignedX;
      break;
    case "right":
      left = target.left + target.width + GAP;
      top = alignedY;
      break;
    case "left":
      left = target.left - card.width - GAP;
      top = alignedY;
      break;
  }

  return {
    side,
    left: clamp(left, MARGIN, viewport.width - card.width - MARGIN),
    top: clamp(top, MARGIN, viewport.height - card.height - MARGIN),
  };
}

// Dead-center placement for anchor-less steps and the missing-target fallback.
export function centerPlacement(card: Size, viewport: Viewport): Placement {
  return {
    side: "bottom",
    top: Math.max(MARGIN, viewport.height / 2 - card.height / 2),
    left: Math.max(MARGIN, viewport.width / 2 - card.width / 2),
  };
}
