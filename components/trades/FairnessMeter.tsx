import { cn } from "@/lib/utils";
import type { FairnessResult } from "@/lib/fairness";

const LABEL_TEXT: Record<FairnessResult["label"], string> = {
  very_fair: "Very fair",
  fair: "Fair",
  slightly_uneven: "Slightly uneven",
  uneven: "Uneven",
  very_uneven: "Very uneven",
};

const LABEL_COLOR: Record<FairnessResult["label"], string> = {
  very_fair: "bg-emerald-500",
  fair: "bg-green-500",
  slightly_uneven: "bg-yellow-500",
  uneven: "bg-orange-500",
  very_uneven: "bg-red-500",
};

export function FairnessMeter({ result }: { result: FairnessResult }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Fairness score</span>
        <span className="text-muted-foreground">
          {result.score.toFixed(0)}/100 · {LABEL_TEXT[result.label]}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", LABEL_COLOR[result.label])}
          style={{ width: `${Math.max(4, result.score)}%` }}
        />
      </div>
    </div>
  );
}
