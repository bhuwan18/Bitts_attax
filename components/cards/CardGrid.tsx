import { CardTile } from "@/components/cards/CardTile";
import { Skeleton } from "@/components/ui/skeleton";
import type { Card } from "@/lib/types/database.types";

export function CardGrid({
  cards,
  isLoading,
}: {
  cards: Card[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4.6] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No cards match your filters.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {cards.map((card) => (
        <CardTile key={card.id} card={card} />
      ))}
    </div>
  );
}
