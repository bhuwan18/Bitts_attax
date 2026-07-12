"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center rounded-lg border border-input">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-r-none"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </Button>
      <span className="w-7 text-center font-sans text-sm font-extrabold tabular-nums">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-l-none"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
