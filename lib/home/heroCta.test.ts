import { describe, expect, it } from "vitest";
import {
  resolveHeroCta,
  selectIncomingOffer,
  type HeroCtaState,
  type OfferCandidate,
} from "./heroCta";

// A user who has cleared every rung of the ladder — spread over it to isolate
// one condition at a time.
function makeState(overrides: Partial<HeroCtaState> = {}): HeroCtaState {
  return {
    inventoryCount: 5,
    wantListCount: 3,
    matchCount: 0,
    incomingOffer: null,
    ...overrides,
  };
}

const offer = { tradeId: "trade-1", fromName: "Ada" };

describe("resolveHeroCta", () => {
  it("asks an empty account to scan its first card", () => {
    const cta = resolveHeroCta(makeState({ inventoryCount: 0 }));

    expect(cta.id).toBe("add-first-card");
    expect(cta.href).toBe("/inventory/add?tab=scan");
  });

  it("asks a collector with no wants to build a want list", () => {
    const cta = resolveHeroCta(makeState({ wantListCount: 0 }));

    expect(cta.id).toBe("build-want-list");
    expect(cta.href).toBe("/inventory/add?list=wants");
  });

  it("surfaces an incoming offer by name and deep-links to the trade", () => {
    const cta = resolveHeroCta(makeState({ incomingOffer: offer }));

    expect(cta.id).toBe("respond-to-offer");
    expect(cta.headline).toContain("Ada");
    expect(cta.href).toBe("/trades/trade-1");
  });

  it("points at traders when matches exist", () => {
    const cta = resolveHeroCta(makeState({ matchCount: 4 }));

    expect(cta.id).toBe("browse-matches");
    expect(cta.headline).toBe("4 traders have cards you want");
    expect(cta.href).toBe("/traders");
  });

  it("singularizes a lone match", () => {
    expect(resolveHeroCta(makeState({ matchCount: 1 })).headline).toBe(
      "1 trader has cards you want"
    );
  });

  it("falls back to scanning when there is nothing pending", () => {
    const cta = resolveHeroCta(makeState());

    expect(cta.id).toBe("grow-collection");
    expect(cta.href).toBe("/inventory/add?tab=scan");
  });

  describe("precedence", () => {
    it("puts an empty inventory above an offer and matches", () => {
      const cta = resolveHeroCta(
        makeState({ inventoryCount: 0, wantListCount: 0, matchCount: 9, incomingOffer: offer })
      );

      expect(cta.id).toBe("add-first-card");
    });

    it("puts an empty want list above an offer and matches", () => {
      const cta = resolveHeroCta(
        makeState({ wantListCount: 0, matchCount: 9, incomingOffer: offer })
      );

      expect(cta.id).toBe("build-want-list");
    });

    it("puts an offer above matches", () => {
      const cta = resolveHeroCta(makeState({ matchCount: 9, incomingOffer: offer }));

      expect(cta.id).toBe("respond-to-offer");
    });
  });
});

const ME = "user-me";
const THEM = { username: "ada", display_name: "Ada L." };

function makeTrade(overrides: Partial<OfferCandidate> = {}): OfferCandidate {
  return {
    id: "trade-1",
    status: "proposed",
    counterparty_id: ME,
    initiator: THEM,
    ...overrides,
  };
}

describe("selectIncomingOffer", () => {
  it("picks a proposed trade where the user is the counterparty, named by first name", () => {
    expect(selectIncomingOffer([makeTrade()], ME)).toEqual({
      tradeId: "trade-1",
      fromName: "Ada",
    });
  });

  it("ignores a trade the user proposed themselves", () => {
    // Same trade seen from the other side: we're the initiator, so it's waiting
    // on them, not on us.
    const outgoing = makeTrade({ counterparty_id: "user-them", initiator: null });

    expect(selectIncomingOffer([outgoing], ME)).toBeNull();
  });

  it("ignores trades that are no longer awaiting a reply", () => {
    const settled = ["accepted", "rejected", "completed", "cancelled"].map((status, i) =>
      makeTrade({ id: `trade-${i}`, status })
    );

    expect(selectIncomingOffer(settled, ME)).toBeNull();
  });

  it("takes the first match, since useMyTrades orders newest first", () => {
    const trades = [
      makeTrade({ id: "newest" }),
      makeTrade({ id: "older" }),
    ];

    expect(selectIncomingOffer(trades, ME)?.tradeId).toBe("newest");
  });

  it("falls back to the username, then to a placeholder, when there's no display name", () => {
    const noDisplayName = makeTrade({ initiator: { username: "ada", display_name: null } });
    expect(selectIncomingOffer([noDisplayName], ME)?.fromName).toBe("ada");

    const noInitiator = makeTrade({ initiator: null });
    expect(selectIncomingOffer([noInitiator], ME)?.fromName).toBe("Someone");
  });

  it("returns null when there are no trades at all", () => {
    expect(selectIncomingOffer([], ME)).toBeNull();
  });
});
