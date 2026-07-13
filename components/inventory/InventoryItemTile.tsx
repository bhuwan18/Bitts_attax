"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FlipHorizontal2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { RemoveInventoryItemButton } from "@/components/inventory/RemoveInventoryItemButton";
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
  const [flipped, setFlipped] = useState(false);
  const stockImageUrl = item.card.image_url;
  const hasBothImages = Boolean(item.custom_image_url && stockImageUrl);
  const frontImageUrl = item.custom_image_url ?? stockImageUrl;

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-card p-2">
      <div
        className={cn(
          "card-surface-gradient flip-card-scene relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2",
          RARITY_BORDER_CLASS[item.card.rarity] ?? RARITY_BORDER_CLASS.other,
          RARITY_GLOW_CLASS[item.card.rarity] ?? RARITY_GLOW_CLASS.other
        )}
      >
        <div className="flip-card-inner" data-flipped={flipped}>
          <Link
            href={`/cards/${item.card.id}`}
            className="flip-card-face"
            aria-label={`View ${item.card.name}`}
          >
            {frontImageUrl && (
              <Image
                src={frontImageUrl}
                alt={item.card.name}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover"
              />
            )}
          </Link>
          {hasBothImages && stockImageUrl && (
            <Link
              href={`/cards/${item.card.id}`}
              className="flip-card-face flip-card-face-back"
              aria-label={`View ${item.card.name}`}
            >
              <Image
                src={stockImageUrl}
                alt={`${item.card.name} (stock image)`}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover"
              />
            </Link>
          )}
        </div>

        {item.custom_image_url && (
          <Badge variant="secondary" className="absolute bottom-1 left-1">
            {flipped ? "Stock image" : "Your photo"}
          </Badge>
        )}
        <RemoveInventoryItemButton
          cardName={item.card.name}
          onConfirm={onRemove}
          className="absolute top-1 left-1 bg-background/80 text-muted-foreground backdrop-blur-sm hover:text-destructive"
        />
        {hasBothImages && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setFlipped((prev) => !prev)}
            aria-label={flipped ? "Show your photo" : "Show stock image"}
            className="absolute top-1 right-1 bg-background/80 text-muted-foreground backdrop-blur-sm hover:text-foreground"
          >
            <FlipHorizontal2 className="size-4" />
          </Button>
        )}
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
