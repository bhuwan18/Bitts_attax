"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Repeat, User, Package, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Renders at every screen size and orientation — this floating pill is the
// app's one universal bottom nav, not a small-screen fallback for a desktop
// sidebar. Notifications and Admin both live in TopBar instead — Admin only
// matters to a handful of users, so it doesn't need a permanent slot here.
// Cards is elevated into its own floating button above the pill (it's the
// app's "hero" content — the cards themselves — so it gets the star
// treatment, the same idea as an Instagram-style floating create button,
// done in our own glowing-card material instead of glass).
const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/trades", label: "Trades", icon: Repeat },
  { href: "/traders", label: "Traders", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

// Highlighting purely off usePathname() is what made this nav feel broken:
// pathname doesn't change until the destination has actually rendered, so on
// any route the router hasn't prefetched, a tap produced *zero* pixels of
// change until the server came back — and people tapped again, restarting the
// navigation and making it slower still.
//
// So each Link reports its own useLinkStatus() pending state up to the nav,
// and the highlight follows `pendingHref ?? pathname`: the tapped pill lights
// up on touch, and the ping on it says "yes, still working". useLinkStatus is
// the right source rather than a plain onClick flag because it also settles
// back to false when a navigation is aborted or superseded, so the highlight
// can't get stuck on a tab we never actually reached.
const NavPendingContext = createContext<(href: string, pending: boolean) => void>(() => {});

// Must be rendered *inside* a <Link> — useLinkStatus reads the pending state
// off the nearest Link ancestor.
function PendingReporter({ href }: { href: string }) {
  const { pending } = useLinkStatus();
  const report = useContext(NavPendingContext);

  useEffect(() => {
    report(href, pending);
  }, [href, pending, report]);

  return null;
}

export function BottomNav() {
  const pathname = usePathname();
  // `from` is the pathname the tap happened on, which is what lets us tell an
  // in-flight navigation apart from one that already landed — see below.
  const [pending, setPending] = useState<{ href: string; from: string } | null>(null);

  const report = useCallback(
    (href: string, isPending: boolean) => {
      setPending((current) => {
        if (isPending) return { href, from: pathname };
        // Only the pill that owns the in-flight navigation may clear it. Without
        // this guard, every *other* pill's initial "not pending" report would
        // stomp the highlight straight back to the old tab.
        return current?.href === href ? null : current;
      });
    },
    [pathname]
  );

  // Once the URL moves off the page the tap was made on, we've arrived and the
  // optimistic target is stale — so the pathname is the truth again. Derived
  // rather than cleared in an effect: no second render pass, and no frame where
  // the highlight still sits on a tab we already reached.
  const pendingHref = pending && pending.from === pathname ? pending.href : null;

  const targetHref = pendingHref ?? pathname;
  // "/" needs an exact match — every route starts with "/", so startsWith
  // would keep Home lit up everywhere.
  const isActive = (href: string) =>
    href === "/" ? targetHref === "/" : targetHref.startsWith(href);

  const cardsActive = isActive("/cards");
  const cardsPending = pendingHref === "/cards";

  return (
    // One nav landmark for both floating pieces — the elevated Cards button
    // is as much a nav destination as anything in the pill below it, so it
    // shouldn't sit outside the landmark a screen reader announces.
    <nav
      aria-label="Primary"
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-2"
    >
      <NavPendingContext.Provider value={report}>
        <Link
          href="/cards"
          aria-current={cardsActive ? "page" : undefined}
          aria-busy={cardsPending || undefined}
          // A second tap on the tab we're already fetching just restarts the
          // navigation. Tapping a *different* tab still interrupts, which is
          // the behaviour we want.
          onClick={(event) => {
            if (cardsPending) event.preventDefault();
          }}
          className={cn(
            "nav-float-glow relative flex touch-manipulation items-center gap-2 rounded-full bg-gradient-to-br from-primary to-brand px-5 py-2.5 text-primary-foreground transition-transform duration-200 ease-[var(--ease-out-quint)] active:scale-95",
            cardsActive && "ring-2 ring-primary-foreground/50"
          )}
        >
          {cardsPending && (
            <span
              aria-hidden="true"
              className="nav-pending-ping absolute inset-0 rounded-full ring-2 ring-primary-foreground"
            />
          )}
          <LayoutGrid className="size-4" strokeWidth={2.5} />
          <span className="font-sans text-xs font-extrabold tracking-wide uppercase">Cards</span>
          <PendingReporter href="/cards" />
        </Link>

        <div className="nav-float-glow flex w-full max-w-md items-stretch rounded-full bg-card px-1 py-1 ring-1 ring-foreground/10">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const pending = pendingHref === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                aria-busy={pending || undefined}
                onClick={(event) => {
                  if (pending) event.preventDefault();
                }}
                // active:scale-90 is the one piece of feedback that owes
                // nothing to the network — it lands on touchdown even if the
                // route takes a second. touch-manipulation drops the mobile
                // double-tap-zoom delay so it lands immediately.
                className="flex flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 py-2 transition-transform duration-150 ease-[var(--ease-out-quint)] active:scale-90"
              >
                <span
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-full transition-all duration-200",
                    active
                      ? "-translate-y-0.5 bg-primary text-primary-foreground shadow-[0_0_14px_color-mix(in_oklch,var(--primary)_60%,transparent)]"
                      : "text-muted-foreground"
                  )}
                >
                  {pending && (
                    <span
                      aria-hidden="true"
                      className="nav-pending-ping absolute inset-0 rounded-full ring-2 ring-primary"
                    />
                  )}
                  <Icon className="size-[17px]" strokeWidth={active ? 2.5 : 2} />
                </span>
                <span
                  className={cn(
                    "font-sans text-[10px] font-extrabold tracking-wide uppercase transition-colors",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
                <PendingReporter href={href} />
              </Link>
            );
          })}
        </div>
      </NavPendingContext.Provider>
    </nav>
  );
}
