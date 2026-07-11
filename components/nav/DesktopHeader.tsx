"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/nav/ThemeToggle";

const NAV_ITEMS = [
  { href: "/cards", label: "Cards" },
  { href: "/inventory", label: "Inventory" },
  { href: "/trades", label: "Trades" },
  { href: "/profile", label: "Profile" },
];

export function DesktopHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 hidden border-b border-border/80 bg-background/90 backdrop-blur-lg md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
        <Link
          href="/cards"
          className="font-heading text-2xl font-extrabold tracking-tight uppercase"
        >
          Bitts <span className="text-primary">Attax</span>
        </Link>
        <nav className="flex h-full flex-1 items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex h-full items-center border-b-2 px-3 font-heading text-sm font-semibold tracking-wide uppercase transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
