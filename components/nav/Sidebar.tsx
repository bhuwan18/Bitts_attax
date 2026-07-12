"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Package, Repeat, Users, Bell, User, Shield } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { useCurrentProfile } from "@/lib/queries/auth";
import { useUnreadNotificationsCount } from "@/lib/queries/notifications";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/cards", label: "Cards", icon: LayoutGrid },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/trades", label: "Trades", icon: Repeat },
  { href: "/traders", label: "Traders", icon: Users },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile & Stats", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: profile } = useCurrentProfile();
  const { data: unreadCount } = useUnreadNotificationsCount();

  const navItems =
    profile?.role === "admin" ? [...NAV_ITEMS, { href: "/admin", label: "Admin", icon: Shield }] : NAV_ITEMS;

  const name = profile?.display_name ?? profile?.username ?? "Collector";
  const initials = getInitials(name);

  return (
    <aside className="sticky top-0 hidden h-screen w-[216px] shrink-0 flex-col bg-sidebar px-3 py-5 md:flex">
      <Link
        href="/"
        className="mb-6 flex items-center gap-2 px-2 font-heading text-lg font-bold tracking-tight"
      >
        <Logo className="size-6 text-brand" />
        Bitts Attax
      </Link>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn("size-[18px]", active && "text-sidebar-primary")} strokeWidth={active ? 2.5 : 2} />
              {label}
              {href === "/notifications" && !!unreadCount && (
                <span className="absolute top-2 left-6 size-2 rounded-full bg-destructive ring-2 ring-sidebar" />
              )}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/profile"
        className="mt-auto flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-sidebar-accent"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand font-sans text-xs font-extrabold text-primary-foreground">
          {initials}
        </span>
        <span className="truncate text-sm font-semibold text-sidebar-foreground">{name}</span>
      </Link>
    </aside>
  );
}
