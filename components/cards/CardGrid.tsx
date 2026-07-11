import { CardTile } from "@/components/cards/CardTile";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchX } from "lucide-react";
import type { CardListItem } from "@/lib/queries/cardsShared";

const PRIORITY_TILE_COUNT = 8; // first row+ across breakpoints, not the whole page

export function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="clip-corner-sm aspect-[3/4.6] w-full rounded-none" />
      ))}
    </div>
  );
}

export function CardGrid({
  cards,
  isLoading,
}: {
  cards: CardListItem[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <CardGridSkeleton />;
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <SearchX className="size-8 text-muted-foreground/60" />
        <div>
          <p className="font-heading text-lg font-bold">No cards match</p>
          <p className="text-sm text-muted-foreground">Try a different name or rarity filter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
      {cards.map((card, i) => (
        <CardTile key={card.id} card={card} priority={i < PRIORITY_TILE_COUNT} />
      ))}
    </div>
  );
}
