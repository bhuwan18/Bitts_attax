"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { cn } from "@/lib/utils";

// Renders at every screen size and orientation — the floating pill BottomNav
// plus this top bar are the app's one universal nav shell, not a
// small-screen fallback for a desktop sidebar.
export function TopBar() {
  const homeActive = usePathname() === "/";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <Link
          href="/"
          aria-current={homeActive ? "page" : undefined}
          className={cn(
            "flex items-center gap-2 rounded-full py-1 pr-3 pl-2 font-heading text-lg tracking-tight transition-colors",
            homeActive && "bg-accent"
          )}
        >
          <Logo className="size-5 text-brand" />
          Bitts Attax
        </Link>
        <NotificationBell />
      </div>
    </header>
  );
}
