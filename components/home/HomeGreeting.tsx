"use client";

import { useCurrentProfile } from "@/lib/queries/auth";

// The greeting name is read client-side rather than in app/(main)/page.tsx on
// purpose — see the note there. It's usually free: TopBar already calls
// useCurrentProfile() from the shared (main) layout, so the row is warm in the
// TanStack cache and the name paints on the first frame of the tab switch.
export function HomeGreeting() {
  const { data: profile } = useCurrentProfile();
  const name = profile?.display_name ?? profile?.username;

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-4 animation-duration-500 px-4 pt-6 sm:px-6">
      <p className="text-sm font-semibold text-muted-foreground">Welcome back,</p>
      <h1 className="font-heading text-3xl leading-tight sm:text-4xl">
        {name ?? (
          // A non-breaking space inside the placeholder makes it exactly one
          // line-box tall, so the heading is the same height with or without a
          // name and the dashboard below it never jumps when the profile lands.
          <span
            aria-hidden="true"
            className="inline-block w-48 max-w-full animate-pulse rounded-lg bg-muted align-middle"
          >
            &nbsp;
          </span>
        )}
      </h1>
    </div>
  );
}
