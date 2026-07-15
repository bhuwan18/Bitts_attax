import { describe, expect, it } from "vitest";
import {
  centerPlacement,
  chooseSide,
  computePlacement,
  type RectLike,
  type Size,
  type Viewport,
} from "./placement";

const viewport: Viewport = { width: 1000, height: 800 };
const card: Size = { width: 320, height: 160 };

describe("chooseSide", () => {
  it("prefers below when there's room under the target", () => {
    const target: RectLike = { top: 100, left: 400, width: 200, height: 50 };
    expect(chooseSide(target, card, viewport)).toBe("bottom");
  });

  it("falls back to above when the target hugs the bottom edge", () => {
    const target: RectLike = { top: 700, left: 400, width: 200, height: 50 };
    expect(chooseSide(target, card, viewport)).toBe("top");
  });

  it("picks the roomiest side when nothing fits cleanly", () => {
    // A tall target filling most of the height, offset left — left has the most
    // free space, so that's where the card should land.
    const target: RectLike = { top: 20, left: 700, width: 60, height: 760 };
    expect(chooseSide(target, card, viewport)).toBe("left");
  });
});

describe("computePlacement", () => {
  it("anchors below and horizontally centers on the target", () => {
    const target: RectLike = { top: 100, left: 400, width: 200, height: 50 };
    const result = computePlacement(target, card, viewport);
    expect(result.side).toBe("bottom");
    expect(result.top).toBe(162); // 100 + 50 + GAP(12)
    expect(result.left).toBe(340); // center: 500 - 160
  });

  it("clamps the card inside the right edge", () => {
    const target: RectLike = { top: 100, left: 950, width: 40, height: 40 };
    const result = computePlacement(target, card, viewport);
    // max left = viewport.width - card.width - MARGIN = 1000 - 320 - 12
    expect(result.left).toBe(668);
  });

  it("honors an explicit preferred side", () => {
    const target: RectLike = { top: 300, left: 400, width: 200, height: 50 };
    const result = computePlacement(target, card, viewport, "right");
    expect(result.side).toBe("right");
    expect(result.left).toBe(612); // 400 + 200 + GAP(12)
  });

  it("pins to the margin when the card is wider than the viewport run", () => {
    const narrow: Viewport = { width: 300, height: 800 };
    const target: RectLike = { top: 100, left: 100, width: 100, height: 40 };
    const result = computePlacement(target, card, narrow);
    // card (320) wider than viewport (300): max < min, so pin to MARGIN.
    expect(result.left).toBe(12);
  });
});

describe("centerPlacement", () => {
  it("centers the card in the viewport", () => {
    const result = centerPlacement(card, viewport);
    expect(result.top).toBe(320); // 400 - 80
    expect(result.left).toBe(340); // 500 - 160
  });
});
