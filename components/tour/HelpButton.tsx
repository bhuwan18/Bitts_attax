"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTour } from "./TourProvider";

// The "?" affordance that replays a page's tour on demand. Distinct from
// auto-start (TourAutoStart): tapping this never consults the "seen" flag, so a
// returning user can always re-run the walkthrough.
export function HelpButton({
  tourId,
  label = "Show me around",
  className,
}: {
  tourId: string;
  label?: string;
  className?: string;
}) {
  const { startTour } = useTour();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      onClick={() => startTour(tourId)}
      className={cn("text-muted-foreground hover:text-foreground", className)}
    >
      <HelpCircle className="size-5" />
    </Button>
  );
}
