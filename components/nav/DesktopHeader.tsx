"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/cards", label: "Cards" },
  { href: "/inventory", label: "Inventory" },
  { href: "/trades", label: "Trades" },
  { href: "/profile", label: "Profile" },
];

export function DesktopHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 hidden border-b bg-background/95 backdrop-blur md:block">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/cards" className="text-lg font-semibold">
          Bitts Attax
        </Link>
        <nav className="flex gap-4 text-sm">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "transition-colors hover:text-foreground",
                pathname.startsWith(href) ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
