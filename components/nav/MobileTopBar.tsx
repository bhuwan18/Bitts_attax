"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-lg md:hidden">
      <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight">
        <Logo className="size-5 text-brand" />
        Bitts Attax
      </Link>
      <NotificationBell />
    </header>
  );
}
