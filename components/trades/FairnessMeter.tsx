"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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

export function FairnessMeter({
  result,
  sideALabel = "Side A",
  sideBLabel = "Side B",
}: {
  result: FairnessResult;
  sideALabel?: string;
  sideBLabel?: string;
}) {
  const style = LABEL_STYLE[result.label];
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-border">
      <div className="flex items-center gap-4">
        <div className="flex shrink-0 flex-col items-center leading-none">
          <span className="font-heading text-4xl tabular-nums">{result.score.toFixed(0)}</span>
          <span className="mt-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            / 100
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">Fairness score</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-sans text-[10px] font-extrabold tracking-wide uppercase",
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

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center gap-1 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? "Hide reasoning" : "Why this score?"}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && <FairnessReasoning result={result} sideALabel={sideALabel} sideBLabel={sideBLabel} />}
    </div>
  );
}

function FairnessReasoning({
  result,
  sideALabel,
  sideBLabel,
}: {
  result: FairnessResult;
  sideALabel: string;
  sideBLabel: string;
}) {
  const { sideA, sideB, deltaPct } = result;
  const heavierSide = sideA.compositeValue === sideB.compositeValue
    ? null
    : sideA.compositeValue > sideB.compositeValue
      ? sideALabel
      : sideBLabel;

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <p className="text-xs text-muted-foreground">
        {heavierSide
          ? `${heavierSide} is offering about ${deltaPct.toFixed(0)}% more overall value, once price, rarity, and OVR rating are weighed together.`
          : "Both sides offer equal overall value once price, rarity, and OVR rating are weighed together."}
      </p>

      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-2">
        <span />
        <span className="truncate text-right text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          {sideALabel}
        </span>
        <span className="truncate text-right text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          {sideBLabel}
        </span>

        <ReasoningRow label="Price" a={sideA.priceTotal} b={sideB.priceTotal} formatter={formatCurrency} />
        <ReasoningRow label="Rarity" a={sideA.rarityScore} b={sideB.rarityScore} formatter={formatNumber} />
        <ReasoningRow label="OVR rating" a={sideA.ovrTotal} b={sideB.ovrTotal} formatter={formatNumber} />
      </div>
    </div>
  );
}

function ReasoningRow({
  label,
  a,
  b,
  formatter,
}: {
  label: string;
  a: number;
  b: number;
  formatter: (n: number) => string;
}) {
  return (
    <>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn("text-right text-xs tabular-nums", a > b && "font-semibold text-foreground")}
      >
        {formatter(a)}
      </span>
      <span
        className={cn("text-right text-xs tabular-nums", b > a && "font-semibold text-foreground")}
      >
        {formatter(b)}
      </span>
    </>
  );
}

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatNumber(n: number): string {
  return n.toFixed(0);
}
