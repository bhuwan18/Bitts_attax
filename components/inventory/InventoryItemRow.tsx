"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { RemoveInventoryItemButton } from "@/components/inventory/RemoveInventoryItemButton";
import { RarityBadge } from "@/components/cards/RarityBadge";
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
  const imageUrl = item.custom_image_url ?? item.card.image_url;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-2 ring-1 ring-border">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        <Link href={`/cards/${item.card.id}`} className="absolute inset-0" aria-label={`View ${item.card.name}`}>
          {imageUrl && <Image src={imageUrl} alt={item.card.name} fill className="object-cover" />}
        </Link>
        {item.custom_image_url && (
          <Badge
            variant="secondary"
            className="absolute bottom-0 left-0 h-auto rounded-none rounded-tr-md px-1 py-0 text-[9px] leading-tight"
          >
            Your photo
          </Badge>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.card.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.card.team ?? "—"}
          {item.card.set_name && ` · ${item.card.set_name}`}
        </p>
        <RarityBadge rarity={item.card.rarity} className="mt-1" />
      </div>
      <QuantityStepper value={item.quantity} onChange={onUpdateQuantity} />
      <RemoveInventoryItemButton
        cardName={item.card.name}
        onConfirm={onRemove}
        className="text-muted-foreground hover:text-destructive"
      />
    </div>
  );
}
