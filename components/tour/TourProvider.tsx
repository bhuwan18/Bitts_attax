"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getTour } from "@/lib/tour/tours";
import { markTourSeen } from "@/lib/tour/storage";

interface ActiveTour {
  tourId: string;
  stepIndex: number;
}

interface TourContextValue {
  active: ActiveTour | null;
  startTour: (id: string) => void;
  next: () => void;
  prev: () => void;
  // `end` completes the tour (last step's "Done"); `skip` dismisses it early.
  // Both mark the tour seen so it won't auto-open again.
  end: () => void;
  skip: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within a TourProvider");
  return ctx;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ActiveTour | null>(null);

  const startTour = useCallback((id: string) => {
    const tour = getTour(id);
    if (!tour || tour.steps.length === 0) return;
    setActive({ tourId: id, stepIndex: 0 });
  }, []);

  const dismiss = useCallback(() => {
    setActive((current) => {
      if (current) markTourSeen(current.tourId);
      return null;
    });
  }, []);

  const next = useCallback(() => {
    setActive((current) => {
      if (!current) return current;
      const tour = getTour(current.tourId);
      if (!tour) return null;
      // Past the last step → finished. Marking seen here (not only on an
      // explicit dismiss) covers the "step all the way through" path.
      if (current.stepIndex >= tour.steps.length - 1) {
        markTourSeen(current.tourId);
        return null;
      }
      return { ...current, stepIndex: current.stepIndex + 1 };
    });
  }, []);

  const prev = useCallback(() => {
    setActive((current) =>
      current && current.stepIndex > 0 ? { ...current, stepIndex: current.stepIndex - 1 } : current
    );
  }, []);

  const value = useMemo<TourContextValue>(
    () => ({ active, startTour, next, prev, end: dismiss, skip: dismiss }),
    [active, startTour, next, prev, dismiss]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
