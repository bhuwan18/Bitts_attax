"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";

// Renders at every screen size and orientation — the floating pill BottomNav
// plus this top bar are the app's one universal nav shell, not a
// small-screen fallback for a desktop sidebar.
//
// Deliberately full-bleed rather than centred in its own max-width: page
// containers vary (galleries 6xl, profile/feeds 4xl, forms 2xl), so any single
// cap here would misalign with most of them. Matching the pages' own
// horizontal padding instead keeps the wordmark flush with the content below.
export function TopBar() {
  const homeActive = usePathname() === "/";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border/80 bg-background/90 px-4 backdrop-blur-lg sm:px-6">
      {/* No active-state background: this is the brand wordmark, and styling it
          like a selected tab reads as a stray chip. It still links home. */}
      <Link
        href="/"
        aria-current={homeActive ? "page" : undefined}
        className="flex min-w-0 items-center gap-2 font-heading text-lg tracking-tight"
      >
        <Logo className="size-5 shrink-0 text-brand" />
        <span className="truncate">Bitts Attax</span>
      </Link>
      <NotificationBell />
    </header>
  );
}
