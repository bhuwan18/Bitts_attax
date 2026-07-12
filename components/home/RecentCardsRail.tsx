"use client";

import Link from "next/link";
import { CardTile } from "@/components/cards/CardTile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRecentCards } from "@/lib/queries/cards";

export function RecentCardsRail() {
  const { data: cards } = useRecentCards(10);

  if (!cards || cards.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-heading text-lg font-bold">Recently added</h2>
        <Link href="/cards" className="text-sm text-primary">
          See all
        </Link>
      </div>
      <ScrollArea>
        <div className="flex gap-3 pb-3">
          {cards.map((card) => (
            <div key={card.id} className="w-28 shrink-0">
              <CardTile card={card} />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
