"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Repeat, User, Package, Shield, Users, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentProfile } from "@/lib/queries/auth";
import { useUnreadNotificationsCount } from "@/lib/queries/notifications";

const NAV_ITEMS = [
  { href: "/cards", label: "Cards", icon: LayoutGrid },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/trades", label: "Trades", icon: Repeat },
  { href: "/traders", label: "Traders", icon: Users },
  { href: "/notifications", label: "Inbox", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: profile } = useCurrentProfile();
  const { data: unreadCount } = useUnreadNotificationsCount();

  const navItems =
    profile?.role === "admin"
      ? [...NAV_ITEMS, { href: "/admin", label: "Admin", icon: Shield }]
      : NAV_ITEMS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5"
          >
            <span
              className={cn(
                "relative flex size-9 items-center justify-center rounded-full transition-all duration-200",
                active
                  ? "-translate-y-0.5 bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="size-[18px]" strokeWidth={active ? 2.5 : 2} />
              {href === "/notifications" && !!unreadCount && (
                <span className="absolute top-0.5 right-1 size-2 rounded-full bg-destructive ring-2 ring-card" />
              )}
            </span>
            <span
              className={cn(
                "font-heading text-[11px] font-semibold uppercase tracking-wide transition-colors",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
