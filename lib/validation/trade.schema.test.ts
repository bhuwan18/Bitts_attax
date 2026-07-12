import { describe, expect, it } from "vitest";
import { ProposeTradeSchema } from "./trade.schema";

const COUNTERPARTY = "11111111-1111-4111-8111-111111111111";
const CARD = "22222222-2222-4222-8222-222222222222";

describe("ProposeTradeSchema", () => {
  it("rejects a trade with nothing on either side", () => {
    const result = ProposeTradeSchema.safeParse({
      listingId: null,
      counterpartyId: COUNTERPARTY,
      myItems: [],
      theirItems: [],
    });

    expect(result.success).toBe(false);
  });

  // One-sided is allowed on purpose — a gift, or asking for a freebie.
  it.each([
    ["only an offer", { myItems: [{ cardId: CARD, quantity: 1 }], theirItems: [] }],
    ["only a request", { myItems: [], theirItems: [{ cardId: CARD, quantity: 1 }] }],
  ])("accepts a trade with %s", (_label, items) => {
    const result = ProposeTradeSchema.safeParse({
      listingId: null,
      counterpartyId: COUNTERPARTY,
      ...items,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a non-positive quantity", () => {
    const result = ProposeTradeSchema.safeParse({
      listingId: null,
      counterpartyId: COUNTERPARTY,
      myItems: [{ cardId: CARD, quantity: 0 }],
      theirItems: [],
    });

    expect(result.success).toBe(false);
  });
});
