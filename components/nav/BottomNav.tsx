"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Repeat, User, Package, Shield, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentProfile } from "@/lib/queries/auth";

// Renders at every screen size and orientation — this floating pill is the
// app's one universal bottom nav, not a small-screen fallback for a desktop
// sidebar. Home and Notifications live in TopBar instead — too many items in
// this pill would be cramped regardless of viewport width, since its width
// is capped by design (max-w-md), not by the screen. Cards is elevated into
// its own floating button above the pill (it's the app's "hero" content —
// the cards themselves — so it gets the star treatment, the same idea as an
// Instagram-style floating create button, done in our own glowing-card
// material instead of glass).
const NAV_ITEMS = [
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/trades", label: "Trades", icon: Repeat },
  { href: "/traders", label: "Traders", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: profile } = useCurrentProfile();

  const navItems =
    profile?.role === "admin"
      ? [...NAV_ITEMS, { href: "/admin", label: "Admin", icon: Shield }]
      : NAV_ITEMS;

  const cardsActive = pathname.startsWith("/cards");

  return (
    // One nav landmark for both floating pieces — the elevated Cards button
    // is as much a nav destination as anything in the pill below it, so it
    // shouldn't sit outside the landmark a screen reader announces.
    <nav
      aria-label="Primary"
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-2"
    >
      <Link
        href="/cards"
        aria-current={cardsActive ? "page" : undefined}
        className={cn(
          "nav-float-glow flex items-center gap-2 rounded-full bg-gradient-to-br from-primary to-brand px-5 py-2.5 text-primary-foreground transition-transform duration-200 ease-[var(--ease-out-quint)] active:scale-95",
          cardsActive && "ring-2 ring-primary-foreground/50"
        )}
      >
        <LayoutGrid className="size-4" strokeWidth={2.5} />
        <span className="font-sans text-xs font-extrabold tracking-wide uppercase">Cards</span>
      </Link>

      <div className="nav-float-glow flex w-full max-w-md items-stretch rounded-full bg-card px-1 py-1 ring-1 ring-foreground/10">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
            >
              <span
                className={cn(
                  "relative flex size-8 items-center justify-center rounded-full transition-all duration-200",
                  active
                    ? "-translate-y-0.5 bg-primary text-primary-foreground shadow-[0_0_14px_color-mix(in_oklch,var(--primary)_60%,transparent)]"
                    : "text-muted-foreground"
                )}
              >
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
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
