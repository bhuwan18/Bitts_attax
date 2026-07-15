"use client";

import { useLayoutEffect, useState } from "react";

export type TargetStatus = "pending" | "found" | "missing";

interface TargetRect {
  rect: DOMRect | null;
  status: TargetStatus;
}

// How long to wait for a `data-tour` target to appear before giving up and
// letting the step fall back to a centered modal. TanStack-backed lists render
// a skeleton first, so a card the tour points at may be a frame or two late.
const POLL_TIMEOUT_MS = 1200;

interface Tracked {
  // Which target the stored rect belongs to. When it doesn't match the target
  // being asked for (i.e. the step just changed), the stored value is stale and
  // we report "pending" from render — resetting without a synchronous setState
  // in the effect.
  name: string | null;
  rect: DOMRect | null;
  status: TargetStatus;
}

// Resolves `[data-tour="<name>"]`, scrolls it into view, and keeps its viewport
// rect in sync while the tour is showing (ResizeObserver + scroll/resize). All
// state updates happen inside observer/rAF callbacks — never synchronously in
// the effect body — so a step change shows "pending" for a frame rather than a
// spotlight stuck at the previous element's position.
export function useElementRect(name: string | null | undefined): TargetRect {
  const [tracked, setTracked] = useState<Tracked>({ name: null, rect: null, status: "pending" });

  useLayoutEffect(() => {
    if (!name) return;

    let cancelled = false;
    let raf = 0;
    let observer: ResizeObserver | null = null;
    let el: Element | null = null;

    const measure = () => {
      if (el && !cancelled) setTracked({ name, rect: el.getBoundingClientRect(), status: "found" });
    };

    const attach = (found: Element) => {
      el = found;
      found.scrollIntoView({ block: "center", inline: "nearest" });
      // ResizeObserver delivers an initial callback on observe(), which is what
      // produces the first measurement (in a callback, not the effect body).
      observer = new ResizeObserver(measure);
      observer.observe(found);
      window.addEventListener("scroll", measure, true);
      window.addEventListener("resize", measure);
    };

    const immediate = document.querySelector(`[data-tour="${name}"]`);
    if (immediate) {
      attach(immediate);
    } else {
      const start = performance.now();
      const poll = () => {
        if (cancelled) return;
        const found = document.querySelector(`[data-tour="${name}"]`);
        if (found) {
          attach(found);
          return;
        }
        if (performance.now() - start > POLL_TIMEOUT_MS) {
          setTracked({ name, rect: null, status: "missing" });
          return;
        }
        raf = requestAnimationFrame(poll);
      };
      raf = requestAnimationFrame(poll);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [name]);

  if (!name) return { rect: null, status: "missing" };
  // Stored value belongs to a previous step → treat as still resolving.
  if (tracked.name !== name) return { rect: null, status: "pending" };
  return { rect: tracked.rect, status: tracked.status };
}
