import { cn } from "@/lib/utils";
import type { FairnessResult } from "@/lib/fairness";

const LABEL_TEXT: Record<FairnessResult["label"], string> = {
  very_fair: "Very fair",
  fair: "Fair",
  slightly_uneven: "Slightly uneven",
  uneven: "Uneven",
  very_uneven: "Very uneven",
};

const LABEL_STYLE: Record<FairnessResult["label"], { bar: string; chip: string; segments: number }> = {
  very_fair: { bar: "bg-success", chip: "bg-success text-success-foreground", segments: 5 },
  fair: { bar: "bg-success/70", chip: "bg-success/15 text-success", segments: 4 },
  slightly_uneven: { bar: "bg-warning", chip: "bg-warning text-warning-foreground", segments: 3 },
  uneven: { bar: "bg-destructive/70", chip: "bg-destructive/15 text-destructive", segments: 2 },
  very_uneven: { bar: "bg-destructive", chip: "bg-destructive text-destructive-foreground", segments: 1 },
};

export function FairnessMeter({ result }: { result: FairnessResult }) {
  const style = LABEL_STYLE[result.label];

  return (
    <div className="flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-border">
      <div className="flex shrink-0 flex-col items-center leading-none">
        <span className="font-heading text-4xl font-extrabold tabular-nums">
          {result.score.toFixed(0)}
        </span>
        <span className="mt-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          / 100
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">Fairness score</span>
          <span
            className={cn(
              "clip-corner-sm px-2 py-0.5 font-heading text-[10px] font-bold tracking-wide uppercase",
              style.chip
            )}
          >
            {LABEL_TEXT[result.label]}
          </span>
        </div>
        <div className="flex h-2 w-full gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-full flex-1 rounded-full transition-colors duration-300",
                i < style.segments ? style.bar : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
