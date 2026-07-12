"use client";

import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RARITY_BORDER_CLASS, RARITY_GLOW_CLASS } from "@/lib/cards/rarity";
import { TraderCardDialog } from "@/components/traders/TraderCardDialog";
import { useTradeDraft } from "@/components/traders/TradeDraftProvider";
import type { TraderInventoryItem } from "@/lib/queries/traders";

export function TraderInventoryGrid({
  items,
  traderName,
}: {
  items: TraderInventoryItem[];
  traderName: string;
}) {
  const { isRequested } = useTradeDraft();
  // One dialog for the whole grid rather than one per tile — only ever a single
  // card open at a time.
  const [selected, setSelected] = useState<TraderInventoryItem | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No Haves listed yet.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => {
          const imageUrl = item.custom_image_url ?? item.card.image_url;
          const requested = isRequested(item.card.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              aria-label={`View ${item.card.name}`}
              className="flex flex-col gap-2 rounded-lg bg-card p-2 text-left transition-transform duration-300 ease-[var(--ease-out-quint)] hover:-translate-y-1 hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95"
            >
              <div
                className={cn(
                  "card-surface-gradient relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2",
                  RARITY_BORDER_CLASS[item.card.rarity] ?? RARITY_BORDER_CLASS.other,
                  RARITY_GLOW_CLASS[item.card.rarity] ?? RARITY_GLOW_CLASS.other
                )}
              >
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={item.card.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                )}
                {item.quantity > 1 && (
                  <Badge variant="secondary" className="absolute top-1 right-1">
                    ×{item.quantity}
                  </Badge>
                )}
                {requested && (
                  <div className="absolute inset-0 flex items-center justify-center bg-success/25 backdrop-blur-[1px]">
                    <span className="flex items-center gap-1 rounded-full bg-success px-2 py-1 font-sans text-[10px] font-extrabold tracking-wide text-success-foreground uppercase">
                      <Check className="size-3" strokeWidth={3} />
                      Requested
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="truncate text-sm font-semibold">{item.card.name}</p>
                <p className="truncate text-xs text-muted-foreground">{item.card.team ?? "—"}</p>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <TraderCardDialog
          key={selected.id}
          item={selected}
          traderName={traderName}
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      )}
    </>
  );
}
