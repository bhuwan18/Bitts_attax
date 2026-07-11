"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import type { InventoryItemWithCard } from "@/lib/queries/inventory";

export function InventoryItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: InventoryItemWithCard;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-2 ring-1 ring-border">
      <div className="clip-corner-sm relative size-14 shrink-0 overflow-hidden bg-muted">
        {item.card.image_url && (
          <Image src={item.card.image_url} alt={item.card.name} fill className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.card.name}</p>
        <p className="truncate text-xs text-muted-foreground">{item.card.team ?? "—"}</p>
      </div>
      <QuantityStepper value={item.quantity} onChange={onUpdateQuantity} />
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={onRemove}
        aria-label="Remove from inventory"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
