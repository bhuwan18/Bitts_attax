"use client";

import Link from "next/link";
import { CardTile } from "@/components/cards/CardTile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMostOwnedCards } from "@/lib/queries/cards";

export function RecentCardsRail() {
  const { data: cards } = useMostOwnedCards(10);

  if (!cards || cards.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-heading text-lg">Most owned</h2>
        <Link href="/cards" className="text-sm text-primary">
          See all
        </Link>
      </div>
      <ScrollArea>
        <div className="flex gap-3 pb-3">
          {cards.map((card, i) => (
            <div
              key={card.id}
              style={{ animationDelay: `${i * 40}ms` }}
              className="animate-in fade-in-0 slide-in-from-bottom-4 fill-mode-both animation-duration-500 w-36 shrink-0"
            >
              <CardTile card={card} />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
