import type { TourDefinition } from "./types";

// Self-contained tours, one per route, so the engine never has to navigate
// mid-tour or conjure a real trade id. Each auto-starts once (its own storage
// key) and is replayable from the "?" button on its page. The home tour is the
// first thing a new user meets and hands off to the trades tour by pointing at
// the Trades tab.

export const HOME_WELCOME_TOUR: TourDefinition = {
  id: "home-welcome",
  steps: [
    {
      id: "welcome",
      target: "home-greeting",
      title: "Welcome to Bitts Attax",
      body: "Give us 20 seconds and we'll show you around your home base.",
      placement: "bottom",
    },
    {
      id: "hero",
      target: "home-hero",
      title: "Your next move",
      body: "This banner always suggests the best thing to do next — add cards, build a wishlist, or answer an offer.",
      placement: "bottom",
    },
    {
      id: "stats",
      target: "home-stats",
      title: "Your collection at a glance",
      body: "Your unique cards, wishlist, and live trade matches — all tracked here.",
      placement: "bottom",
    },
    {
      id: "to-trades",
      target: "nav-trades",
      title: "Ready to trade?",
      body: "Tap Trades any time to browse offers and swap cards — we'll walk you through it there too.",
      placement: "top",
    },
  ],
};

export const TRADES_LIST_TOUR: TourDefinition = {
  id: "trades-list",
  steps: [
    {
      id: "intro",
      target: "trades-intro",
      title: "Welcome to Trades",
      body: "This is where you swap cards with other collectors. Here's the quick tour.",
      placement: "bottom",
    },
    {
      id: "tabs",
      target: "trades-tabs",
      title: "Browse or track",
      body: "Browse open offers from everyone, or switch to My Trades to see deals you're already part of.",
      placement: "bottom",
    },
    {
      id: "listing",
      target: "trades-listing-card",
      title: "Anatomy of a listing",
      body: "Each listing shows what a trader gives and what they want. Tap one to propose a swap.",
      placement: "auto",
    },
    {
      id: "new-listing",
      target: "trades-new-listing",
      title: "Post your own",
      body: "Got cards to offer? Create a listing here and let others come to you.",
      placement: "bottom",
    },
  ],
};

export const TRADE_DETAIL_TOUR: TourDefinition = {
  id: "trade-detail",
  steps: [
    {
      id: "fairness",
      target: "trade-fairness",
      title: "Is it a fair deal?",
      body: "This meter scores how balanced a trade is, based on each card's value — a quick gut-check before you commit.",
      placement: "bottom",
    },
    {
      id: "sides",
      target: "trade-sides",
      title: "Who gives what",
      body: "Here's exactly what each side puts in. Double-check the cards and quantities.",
      placement: "auto",
    },
    {
      id: "actions",
      target: "trade-actions",
      title: "Accept or decline",
      body: "When an offer is waiting on you, accept or decline it right here.",
      placement: "top",
    },
    {
      id: "chat",
      target: "trade-chat",
      title: "Talk it through",
      body: "Message the other trader to sort out details or negotiate before anyone commits.",
      placement: "top",
    },
  ],
};

const TOURS: Record<string, TourDefinition> = {
  [HOME_WELCOME_TOUR.id]: HOME_WELCOME_TOUR,
  [TRADES_LIST_TOUR.id]: TRADES_LIST_TOUR,
  [TRADE_DETAIL_TOUR.id]: TRADE_DETAIL_TOUR,
};

export function getTour(id: string): TourDefinition | undefined {
  return TOURS[id];
}
