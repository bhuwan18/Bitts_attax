// Per-device "have they seen this tour?" flag. localStorage rather than the DB
// on purpose (see the plan): zero backend/migration, and re-seeing a tour after
// switching devices is acceptable — arguably desirable — for onboarding help.
//
// Keys are versioned (`:v1`) so materially rewriting a tour's steps later can
// re-surface it to everyone by bumping the suffix.

const PREFIX = "bitts:tour:";
const VERSION = "v1";

function keyFor(id: string): string {
  return `${PREFIX}${id}:${VERSION}`;
}

// Reads never run during render (only from effects), but guard for SSR anyway.
// On the server, or when storage is blocked (private mode / disabled cookies),
// treat the tour as already seen so we never auto-open — a help tour that can't
// remember being dismissed must not nag on every visit.
export function hasSeenTour(id: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(keyFor(id)) !== null;
  } catch {
    return true;
  }
}

export function markTourSeen(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(id), new Date().toISOString());
  } catch {
    // Storage unavailable — nothing to persist. The tour simply may auto-open
    // again next visit, which is a better failure than throwing here.
  }
}
