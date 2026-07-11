import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card as UiCard, CardContent } from "@/components/ui/card";
import type { Card } from "@/lib/types/database.types";

const RARITY_LABEL: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  super_rare: "Super Rare",
  legend: "Legend",
  limited: "Limited",
  other: "Other",
};

const RARITY_VARIANT: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  common: "secondary",
  uncommon: "secondary",
  rare: "default",
  super_rare: "default",
  legend: "destructive",
  limited: "destructive",
  other: "outline",
};

export function CardTile({ card }: { card: Card }) {
  return (
    <Link href={`/cards/${card.id}`}>
      <UiCard className="h-full gap-2 py-3 transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-2 px-3">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-muted">
            {card.image_url ? (
              <Image
                src={card.image_url}
                alt={card.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No image
              </div>
            )}
            {card.ovr_rating != null && (
              <div className="absolute right-1 top-1 rounded bg-background/90 px-1.5 py-0.5 text-xs font-semibold">
                {card.ovr_rating}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <p className="truncate text-sm font-medium">{card.name}</p>
            <p className="truncate text-xs text-muted-foreground">{card.team ?? "—"}</p>
            <Badge variant={RARITY_VARIANT[card.rarity] ?? "outline"} className="w-fit text-xs">
              {RARITY_LABEL[card.rarity] ?? card.rarity}
            </Badge>
            {card.base_price != null && (
              <p className="text-xs text-muted-foreground">${card.base_price.toFixed(2)}</p>
            )}
          </div>
        </CardContent>
      </UiCard>
    </Link>
  );
}
