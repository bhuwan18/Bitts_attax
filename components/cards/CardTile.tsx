import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RARITY_BORDER_CLASS, RARITY_GLOW_CLASS, FOIL_RARITIES } from "@/lib/cards/rarity";
import { RarityBadge } from "@/components/cards/RarityBadge";
import type { CardListItem } from "@/lib/queries/cardsShared";

export function CardTile({ card, priority = false }: { card: CardListItem; priority?: boolean }) {
  const foil = FOIL_RARITIES.has(card.rarity);

  return (
    <Link href={`/cards/${card.id}`} className="group block">
      <div
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-lg bg-card transition-transform duration-300 ease-[var(--ease-out-quint)] group-hover:-translate-y-1.5 group-hover:scale-[1.03]",
          foil && "foil-sheen"
        )}
      >
        <div
          className={cn(
            "card-surface-gradient relative aspect-[3/4] w-full shrink-0 rounded-lg border-2",
            RARITY_BORDER_CLASS[card.rarity] ?? RARITY_BORDER_CLASS.other,
            RARITY_GLOW_CLASS[card.rarity] ?? RARITY_GLOW_CLASS.other
          )}
        >
          {card.image_url ? (
            <Image
              src={card.image_url}
              alt={card.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
              className="rounded-[calc(var(--radius-lg)-2px)] object-cover"
              priority={priority}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
          {card.ovr_rating != null && (
            <div className="absolute top-0 left-0 rounded-lg bg-foreground/90 px-2.5 py-1.5 font-heading text-lg leading-none text-background backdrop-blur-sm">
              {card.ovr_rating}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-2.5">
          <p className="truncate text-sm leading-tight font-semibold">{card.name}</p>
          <p className="truncate text-xs text-muted-foreground">{card.team ?? "Free agent"}</p>
          {card.set_name && (
            <p className="truncate text-[11px] text-muted-foreground/70">{card.set_name}</p>
          )}
          <div className="mt-auto flex items-center justify-between gap-1 pt-1.5">
            <RarityBadge rarity={card.rarity} />
            {card.base_price != null && (
              <span className="text-xs font-medium text-muted-foreground">
                ${card.base_price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
