"use client";

import Link from "next/link";
import { ArrowRight, Heart, Repeat, ScanLine, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveHeroCta, selectIncomingOffer, type HeroCtaId } from "@/lib/home/heroCta";
import { useCurrentUser } from "@/lib/queries/auth";
import { useInventory, useWantList } from "@/lib/queries/inventory";
import { useTradeMatches } from "@/lib/queries/matches";
import { useMyTrades } from "@/lib/queries/trades";
import { cn } from "@/lib/utils";

// Presentation-only, resolved here rather than in lib/home/heroCta.ts so that
// module stays a pure data function (same split as lib/gamification/badgeIcons).
const HERO_ICON: Record<HeroCtaId, LucideIcon> = {
  "add-first-card": ScanLine,
  "build-want-list": Heart,
  "respond-to-offer": Repeat,
  "browse-matches": Users,
  "grow-collection": ScanLine,
};

// Worn by both the card and its loading placeholder so the dashboard below
// doesn't jump when the queries land. Two floors because the layout reflows:
// the action sits inline with the copy once there's room for it, and drops
// below on a phone.
const SHELL = "min-h-38 rounded-2xl sm:min-h-24";

// A note on restraint, since this is the page's loudest element by role and the
// temptation is to make it the loudest by pixel too: the panel is a *tint* of
// the interactive accent (matching StreakBanner's border/bg language), not a
// full accent fill. Cyan and pink are signal colors here — cyan means
// interactive, pink means brand/legend rarity — and a full-bleed gradient of
// both turns the largest surface on the page into an accent, which drowns out
// the rarity glow on the card art below and inverts a deliberately dark-only
// theme. The saturation is spent on the two things you can act on: the icon
// chip and the button.

// The one "what next?" action on the home page. Every other dashboard widget
// hides itself when it has no data, so without this a new user's home screen is
// a greeting and three zeroes.
export function HeroCta() {
  const { data: user } = useCurrentUser();
  const { data: inventory } = useInventory();
  const { data: wantList } = useWantList();
  const { data: trades } = useMyTrades();
  const { data: matches } = useTradeMatches();

  // Resolving the ladder against half-loaded data would flash "Add your first
  // card" at an established collector before correcting itself. Matches are
  // exempt from the wait: they gate only the fourth rung, and if the first
  // three are unmet the answer doesn't depend on them.
  if (!user || !inventory || !wantList || !trades) {
    return <div aria-hidden="true" className={cn(SHELL, "animate-pulse bg-muted")} />;
  }

  const cta = resolveHeroCta({
    inventoryCount: inventory.length,
    wantListCount: wantList.length,
    matchCount: matches?.length ?? 0,
    incomingOffer: selectIncomingOffer(trades, user.id),
  });
  const Icon = HERO_ICON[cta.id];

  return (
    <section
      className={cn(
        SHELL,
        "animate-in fade-in-0 slide-in-from-bottom-4 fill-mode-both animation-duration-500 flex flex-wrap items-center gap-4 border border-primary/30 bg-primary/10 p-4"
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Icon className="size-5" strokeWidth={2.5} />
      </span>
      {/* min-w-0 lets the copy wrap inside its column rather than shoving the
          button off the row. A name in the headline can be any length, so it
          wraps rather than truncating — losing the end of "…wants to trade with
          you" would cost the CTA its meaning. */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className="font-heading text-lg leading-tight sm:text-xl">{cta.headline}</h2>
        <p className="text-sm text-muted-foreground">{cta.subcopy}</p>
      </div>
      <Button render={<Link href={cta.href} />} className="w-full shrink-0 sm:w-fit">
        {cta.actionLabel}
        <ArrowRight className="size-4" />
      </Button>
    </section>
  );
}
