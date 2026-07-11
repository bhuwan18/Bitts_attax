"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="flex items-center gap-3 rounded-md border p-2">
      <div className="relative size-12 shrink-0 overflow-hidden rounded bg-muted">
        {item.card.image_url && (
          <Image src={item.card.image_url} alt={item.card.name} fill className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.card.name}</p>
        <p className="truncate text-xs text-muted-foreground">{item.card.team ?? "—"}</p>
      </div>
      <Input
        type="number"
        min={1}
        max={999}
        value={item.quantity}
        onChange={(e) => onUpdateQuantity(Number(e.target.value) || 1)}
        className="w-16"
      />
      <Button size="icon" variant="ghost" onClick={onRemove} aria-label="Remove from inventory">
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
