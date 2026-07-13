import { cn } from "@/lib/utils";
import { RARITY_LABEL, RARITY_STYLE } from "@/lib/cards/rarity";
import type { Rarity } from "@/lib/types/database.types";

export function RarityBadge({ rarity, className }: { rarity: Rarity; className?: string }) {
  return (
    <span
      className={cn(
        "w-fit shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] font-extrabold tracking-wide uppercase",
        RARITY_STYLE[rarity] ?? RARITY_STYLE.other,
        className
      )}
    >
      {RARITY_LABEL[rarity] ?? rarity}
    </span>
  );
}
