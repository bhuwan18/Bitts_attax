"use client";

import { useEffect, useRef } from "react";
import { hasSeenTour, markTourSeen } from "@/lib/tour/storage";
import { useTour } from "./TourProvider";

// Fires a tour once, the first time this mounts for a user who hasn't seen it.
// Drop it on a page whose targets exist by the time it mounts (e.g. after a
// trade detail's loading guard). Marking seen *here* — not only when the tour
// finishes — makes auto-start genuinely one-and-done even if the user abandons
// it; the "?" HelpButton is the deliberate way back in.
export function TourAutoStart({ tourId }: { tourId: string }) {
  const { startTour } = useTour();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    if (hasSeenTour(tourId)) return;
    markTourSeen(tourId);
    startTour(tourId);
  }, [tourId, startTour]);

  return null;
}
