import { firstNameOf, type NamedProfile } from "@/lib/profile/name";

// The home page's single "what should I do next?" call to action. Kept as a
// pure function (no React, no icons) so the ladder itself is unit-testable and
// the component below it only has to worry about how the result looks.
//
// The ladder is deliberately onboarding-first: a setup gap outranks trade
// activity, because a user with no Haves can't act on a trade match anyway and
// a user with no Wants generates no matches at all.

export interface HeroCtaState {
  inventoryCount: number;
  wantListCount: number;
  matchCount: number;
  /** A trade someone else proposed *to* this user and is still waiting on. */
  incomingOffer: { tradeId: string; fromName: string } | null;
}

export type HeroCtaId =
  | "add-first-card"
  | "build-want-list"
  | "respond-to-offer"
  | "browse-matches"
  | "grow-collection";

export interface HeroCta {
  id: HeroCtaId;
  headline: string;
  subcopy: string;
  actionLabel: string;
  href: string;
}

const SCAN_HREF = "/inventory/add?tab=scan";

/** The subset of TradeWithDetails this module needs — keeps it free of query types. */
export interface OfferCandidate {
  id: string;
  status: string;
  counterparty_id: string | null;
  initiator: NamedProfile | null;
}

// An offer only belongs in the hero if it's still awaiting *this* user: someone
// else proposed it (they're the initiator, we're the counterparty) and nobody
// has accepted/rejected it yet. A trade the user proposed themselves is waiting
// on the other party, so nagging them about it would be nonsense.
export function selectIncomingOffer(
  trades: OfferCandidate[],
  userId: string
): HeroCtaState["incomingOffer"] {
  const trade = trades.find((t) => t.status === "proposed" && t.counterparty_id === userId);
  if (!trade) return null;

  return {
    tradeId: trade.id,
    fromName: firstNameOf(trade.initiator) ?? "Someone",
  };
}

export function resolveHeroCta(state: HeroCtaState): HeroCta {
  const { inventoryCount, wantListCount, matchCount, incomingOffer } = state;

  if (inventoryCount === 0) {
    return {
      id: "add-first-card",
      headline: "Add your first card",
      subcopy: "Point your camera at it and we'll do the rest.",
      actionLabel: "Scan a card",
      href: SCAN_HREF,
    };
  }

  if (wantListCount === 0) {
    return {
      id: "build-want-list",
      headline: "Build your want list",
      subcopy: "We'll find traders holding the cards you're chasing.",
      actionLabel: "Add cards you're chasing",
      href: "/inventory/add?list=wants",
    };
  }

  if (incomingOffer) {
    return {
      id: "respond-to-offer",
      headline: `${incomingOffer.fromName} wants to trade with you`,
      subcopy: "An offer is waiting on your reply.",
      actionLabel: "Review the offer",
      href: `/trades/${incomingOffer.tradeId}`,
    };
  }

  if (matchCount > 0) {
    return {
      id: "browse-matches",
      headline:
        matchCount === 1
          ? "1 trader has cards you want"
          : `${matchCount} traders have cards you want`,
      subcopy: "See who's holding cards from your want list.",
      actionLabel: "Find a trade",
      href: "/traders",
    };
  }

  return {
    id: "grow-collection",
    headline: "Grow your collection",
    subcopy: "Scan a card to add it to your Haves in seconds.",
    actionLabel: "Scan a card",
    href: SCAN_HREF,
  };
}
