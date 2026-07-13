import Image from "next/image";
import { cn } from "@/lib/utils";
import { RARITY_BORDER_CLASS, RARITY_GLOW_CLASS } from "@/lib/cards/rarity";
import type { Rarity } from "@/lib/types/database.types";

export function CardThumb({
  name,
  imageUrl,
  rarity,
  className,
}: {
  name: string;
  imageUrl: string | null;
  rarity: Rarity;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative size-12 shrink-0 overflow-hidden rounded-lg border-2 bg-muted",
        RARITY_BORDER_CLASS[rarity] ?? RARITY_BORDER_CLASS.other,
        RARITY_GLOW_CLASS[rarity] ?? RARITY_GLOW_CLASS.other,
        className
      )}
    >
      {imageUrl && <Image src={imageUrl} alt={name} fill className="object-cover" sizes="48px" />}
    </div>
  );
}
