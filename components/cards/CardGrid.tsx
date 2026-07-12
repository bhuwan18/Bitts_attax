import { CardTile } from "@/components/cards/CardTile";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchX } from "lucide-react";
import type { CardListItem } from "@/lib/queries/cardsShared";

const PRIORITY_TILE_COUNT = 8; // first row+ across breakpoints, not the whole page

export function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[3/4.6] w-full rounded-lg" />
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
          <p className="font-heading text-lg">No cards match</p>
          <p className="text-sm text-muted-foreground">Try a different name or rarity filter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
      {cards.map((card, i) => (
        <div
          key={card.id}
          // Cycle the delay over 10 items rather than scaling with the full
          // list — infinite-scroll "load more" can append 30 at once, and an
          // unbounded per-index delay would make later tiles crawl in.
          style={{ animationDelay: `${(i % 10) * 40}ms` }}
          className="animate-in fade-in-0 slide-in-from-bottom-4 fill-mode-both animation-duration-500"
        >
          <CardTile card={card} priority={i < PRIORITY_TILE_COUNT} />
        </div>
      ))}
    </div>
  );
}
