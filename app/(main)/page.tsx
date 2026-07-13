import { HomeGreeting } from "@/components/home/HomeGreeting";
import { HomeDashboard } from "@/components/home/HomeDashboard";

// Deliberately not an async Server Component. Calling supabase.auth.getUser()
// here (as this page used to, only to read a display name) makes the route
// dynamic, which means <Link> can't prefetch it — so tapping Home in BottomNav
// paid a full server round-trip before a single pixel could change, and the
// nav looked frozen.
//
// Nothing is lost by dropping it: proxy.ts already gates "/" behind a real
// getUser(), so the redirect this page did was redundant, and the greeting's
// name comes from useCurrentProfile() in HomeGreeting — the same client query
// TopBar already runs. Everything below is a client component reading through
// RLS-scoped TanStack queries, which is how /inventory and /traders already
// work. That leaves this page statically renderable and instantly navigable.
export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <HomeGreeting />
      <HomeDashboard />
    </div>
  );
}
