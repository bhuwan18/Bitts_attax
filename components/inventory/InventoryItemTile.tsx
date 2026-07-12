"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { cn } from "@/lib/utils";
import { RARITY_BORDER_CLASS, RARITY_GLOW_CLASS } from "@/lib/cards/rarity";
import type { InventoryItemWithCard } from "@/lib/queries/inventory";

export function InventoryItemTile({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: InventoryItemWithCard;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const imageUrl = item.custom_image_url ?? item.card.image_url;

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-card p-2 transition-transform duration-300 ease-[var(--ease-out-quint)] hover:-translate-y-1 hover:scale-[1.02]">
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
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover"
          />
        )}
        {item.custom_image_url && (
          <Badge variant="secondary" className="absolute bottom-1 left-1">
            Your photo
          </Badge>
        )}
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onRemove}
          aria-label="Remove from inventory"
          className="absolute top-1 left-1 bg-background/80 text-muted-foreground backdrop-blur-sm hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="truncate text-sm font-semibold">{item.card.name}</p>
        <p className="truncate text-xs text-muted-foreground">{item.card.team ?? "—"}</p>
      </div>
      <div className="flex justify-center">
        <QuantityStepper value={item.quantity} onChange={onUpdateQuantity} />
      </div>
    </div>
  );
}
