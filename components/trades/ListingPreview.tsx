"use client";

import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PickedItem } from "@/components/trades/HaveWantPicker";

/**
 * A faithful preview of how a listing will read on the trades feed — mirrors
 * the pill layout of `TradeListingCard` so what you see is what you post.
 */
export function ListingPreview({
  title,
  haves,
  wants,
  ownerName,
}: {
  title?: string;
  haves: PickedItem[];
  wants: PickedItem[];
  ownerName: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-border">
      <p className="font-heading text-base">{title?.trim() || `${ownerName}'s listing`}</p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <PreviewGroup label="Offering" tone="success" items={haves} />
        <ArrowLeftRight className="mt-4 size-4 shrink-0 text-muted-foreground" />
        <PreviewGroup label="Looking for" tone="primary" items={wants} />
      </div>
    </div>
  );
}

function PreviewGroup({
  label,
  tone,
  items,
}: {
  label: string;
  tone: "success" | "primary";
  items: PickedItem[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {items.length === 0 && (
          <span className="text-xs text-muted-foreground/70">—</span>
        )}
        {items.map((item) => (
          <span
            key={item.cardId}
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              tone === "success" ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
            )}
          >
            {item.name}
            {item.quantity > 1 && ` ×${item.quantity}`}
          </span>
        ))}
      </div>
    </div>
  );
}
