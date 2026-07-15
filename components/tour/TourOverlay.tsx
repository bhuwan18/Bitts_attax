"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTour } from "@/lib/tour/tours";
import {
  centerPlacement,
  computePlacement,
  type Placement,
} from "@/lib/tour/placement";
import { useTour } from "./TourProvider";
import { useElementRect } from "./useElementRect";

// Padding baked around the spotlight so the highlighted element doesn't sit
// flush against the dark edge.
const SPOTLIGHT_PAD = 8;

export function TourOverlay() {
  const { active } = useTour();
  // Mount the working overlay only while a tour runs, so its hooks (rect
  // tracking, key handlers, focus trap) don't run — or need conditional
  // guards — the 99% of the time no tour is open.
  return active ? <TourOverlayInner /> : null;
}

function TourOverlayInner() {
  const { active, next, prev, skip } = useTour();
  // Safe: this component only exists while `active` is set (see TourOverlay).
  const tourId = active!.tourId;
  const stepIndex = active!.stepIndex;
  const tour = getTour(tourId)!;
  const step = tour.steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === tour.steps.length - 1;

  const { rect, status } = useElementRect(step.target);
  const showSpotlight = status === "found" && rect !== null;

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Placement | null>(null);
  const [vpTick, setVpTick] = useState(0);

  // Recompute the card position whenever the target rect, resolution, chosen
  // step, or viewport changes. Runs pre-paint so an anchored card never flashes
  // at the centered position first.
  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const box = cardRef.current.getBoundingClientRect();
    const size = { width: box.width, height: box.height };
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    if (showSpotlight && rect) {
      setPos(computePlacement(rect, size, viewport, step.placement ?? "auto"));
    } else {
      setPos(centerPlacement(size, viewport));
    }
  }, [showSpotlight, rect, step.placement, stepIndex, vpTick]);

  useEffect(() => {
    const onResize = () => setVpTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Move focus into the card on each step and restore it to wherever the user
  // was when the whole tour closes.
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    return () => {
      restoreFocusRef.current?.focus?.();
    };
  }, []);
  useEffect(() => {
    // Query rather than a ref on <Button>: avoids depending on ref-forwarding
    // through the Base UI wrapper, and the primary action is unambiguous.
    cardRef.current?.querySelector<HTMLElement>("[data-tour-primary]")?.focus();
  }, [stepIndex]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        skip();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (!isFirst) prev();
      } else if (event.key === "Tab") {
        // Trap focus among the card's buttons so keyboard users can't tab out
        // to the blocked page behind the overlay.
        const focusables = containerRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled])"
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    [skip, next, prev, isFirst]
  );

  // Portal target only exists in the browser. This inner component never
  // renders during SSR anyway (a tour only becomes active via client
  // interaction), so this is a belt-and-braces guard, not a hydration gate.
  if (typeof document === "undefined") return null;

  const titleId = `tour-${tourId}-${step.id}-title`;
  const bodyId = `tour-${tourId}-${step.id}-body`;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60]"
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      {/* Full-screen click blocker. Box-shadow only darkens; it doesn't capture
          pointer events, so this transparent layer is what actually stops taps
          reaching the page while the tour drives the flow. */}
      <div className="absolute inset-0" aria-hidden="true" />

      {showSpotlight && rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-xl ring-2 ring-primary shadow-[0_0_28px_-6px_color-mix(in_oklch,var(--primary)_60%,transparent)] motion-safe:transition-all motion-safe:duration-300 ease-[var(--ease-out-quint)]"
          style={{
            top: rect.top - SPOTLIGHT_PAD,
            left: rect.left - SPOTLIGHT_PAD,
            width: rect.width + SPOTLIGHT_PAD * 2,
            height: rect.height + SPOTLIGHT_PAD * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.62)",
          }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-black/[0.62]" aria-hidden="true" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="pointer-events-auto fixed w-[min(20rem,calc(100vw-1.5rem))] rounded-xl bg-popover p-4 text-popover-foreground ring-1 ring-foreground/10 shadow-[0_10px_34px_-10px_rgba(0,0,0,0.55)] motion-safe:transition-[top,left] motion-safe:duration-300 ease-[var(--ease-out-quint)]"
        style={{
          top: pos?.top ?? 0,
          left: pos?.left ?? 0,
          visibility: pos ? "visible" : "hidden",
        }}
      >
        <p className="mb-1 font-sans text-[11px] font-extrabold tracking-wide text-muted-foreground uppercase">
          Step {stepIndex + 1} of {tour.steps.length}
        </p>
        <h2 id={titleId} className="font-heading text-lg leading-tight tracking-tight">
          {step.title}
        </h2>
        <p id={bodyId} className="mt-1.5 text-sm text-muted-foreground">
          {step.body}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={skip} className="text-muted-foreground">
            Skip
          </Button>
          <div className="flex items-center gap-1.5">
            {!isFirst && (
              <Button variant="outline" size="sm" onClick={prev}>
                <ArrowLeft className="size-4" />
                Back
              </Button>
            )}
            <Button data-tour-primary="" size="sm" onClick={next}>
              {isLast ? (
                <>
                  <Check className="size-4" />
                  Done
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
