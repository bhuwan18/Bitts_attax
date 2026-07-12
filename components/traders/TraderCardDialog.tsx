"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RARITY_LABEL,
  RARITY_STYLE,
  RARITY_BORDER_CLASS,
  RARITY_GLOW_CLASS,
  FOIL_RARITIES,
} from "@/lib/cards/rarity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatStrip } from "@/components/shared/StatStrip";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { cardToOption } from "@/components/trades/HaveWantPicker";
import { useInventory } from "@/lib/queries/inventory";
import { useTradeDraft } from "@/components/traders/TradeDraftProvider";
import type { TraderInventoryItem } from "@/lib/queries/traders";

/**
 * The card detail behind a tile in a trader's Haves grid, and the place you ask
 * for it. A dialog rather than a trip to /cards/[cardId] so the counterparty and
 * the in-progress trade draft survive the detour.
 *
 * Mount with key={item.id} — quantity state is per-card and resets on remount.
 */
export function TraderCardDialog({
  item,
  traderName,
  open,
  onOpenChange,
}: {
  item: TraderInventoryItem;
  traderName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { card } = item;
  const { requestCard, removeRequest, isRequested } = useTradeDraft();
  const { data: myInventory } = useInventory();
  const [quantity, setQuantity] = useState(1);

  const requested = isRequested(card.id);
  const owned = (myInventory ?? []).find((i) => i.card.id === card.id);
  const foil = FOIL_RARITIES.has(card.rarity);
  // Their photo of their physical card, if they took one — truer to what you'd
  // actually receive than the stock catalog art.
  const imageUrl = item.custom_image_url ?? card.image_url;

  function handleRequest() {
    requestCard(
      cardToOption(card, { imageUrl, maxQuantity: item.quantity }),
      quantity
    );
    toast.success(`Requesting ${card.name} from ${traderName}.`);
    onOpenChange(false);
  }

  function handleRemove() {
    removeRequest(card.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div
            className={cn(
              "card-surface-gradient relative mx-auto aspect-[3/4] w-44 shrink-0 overflow-hidden rounded-xl border-2",
              RARITY_BORDER_CLASS[card.rarity] ?? RARITY_BORDER_CLASS.other,
              RARITY_GLOW_CLASS[card.rarity] ?? RARITY_GLOW_CLASS.other,
              foil && "foil-sheen"
            )}
          >
            {imageUrl ? (
              <Image src={imageUrl} alt={card.name} fill sizes="176px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No image
              </div>
            )}
            {card.ovr_rating != null && (
              <div className="absolute top-0 left-0 rounded-br-lg bg-foreground/90 px-2 py-1 font-heading text-lg leading-none text-background backdrop-blur-sm">
                {card.ovr_rating}
              </div>
            )}
            {item.custom_image_url && (
              <Badge variant="secondary" className="absolute bottom-1 left-1">
                Their photo
              </Badge>
            )}
          </div>

          <div className="text-center">
            <span
              className={cn(
                "mb-1.5 inline-block rounded-full px-2.5 py-1 font-sans text-[11px] font-extrabold tracking-wide uppercase",
                RARITY_STYLE[card.rarity] ?? RARITY_STYLE.other
              )}
            >
              {RARITY_LABEL[card.rarity] ?? card.rarity}
            </span>
            <DialogTitle className="font-heading text-2xl leading-tight tracking-tight">
              {card.name}
            </DialogTitle>
            <DialogDescription>{card.team ?? "Free agent"}</DialogDescription>
          </div>
        </DialogHeader>

        <StatStrip
          items={[
            { label: "Position", value: card.position ?? "—" },
            { label: "Season", value: card.season ?? "—" },
            {
              label: "Base price",
              value: card.base_price != null ? `$${card.base_price.toFixed(2)}` : "—",
            },
          ]}
        />

        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{item.quantity}</span> in {traderName}
            &rsquo;s collection
          </p>
          <p>
            {owned ? (
              <>
                You already own{" "}
                <span className="font-medium text-foreground">{owned.quantity}</span> of these
              </>
            ) : (
              "Not in your collection yet"
            )}
          </p>
          <Link
            href={`/cards/${card.id}`}
            className="w-fit underline underline-offset-3 transition-colors hover:text-foreground"
          >
            View full card
          </Link>
        </div>

        {/* Quantity only matters when they hold more than one to give. */}
        {!requested && item.quantity > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">How many?</span>
            <QuantityStepper
              value={quantity}
              max={item.quantity}
              onChange={setQuantity}
            />
          </div>
        )}

        {requested && (
          <p className="flex items-center gap-1.5 text-xs text-success">
            <Check className="size-3.5" />
            Already in your trade request
          </p>
        )}

        <DialogFooter>
          {requested ? (
            <Button variant="outline" onClick={handleRemove}>
              <X className="size-4" />
              Remove from request
            </Button>
          ) : (
            <Button onClick={handleRequest}>
              <Plus className="size-4" />
              Request this card
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
