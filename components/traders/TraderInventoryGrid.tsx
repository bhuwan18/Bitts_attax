import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { TraderInventoryItem } from "@/lib/queries/traders";

export function TraderInventoryGrid({ items }: { items: TraderInventoryItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No Haves listed yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item) => {
        const imageUrl = item.custom_image_url ?? item.card.image_url;
        return (
          <div key={item.id} className="clip-corner-sm flex flex-col gap-2 bg-card p-2 ring-1 ring-border">
            <div className="clip-corner-sm relative aspect-[3/4] w-full overflow-hidden bg-muted">
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={item.card.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                />
              )}
              {item.quantity > 1 && (
                <Badge variant="secondary" className="absolute top-1 right-1">
                  ×{item.quantity}
                </Badge>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="truncate text-sm font-semibold">{item.card.name}</p>
              <p className="truncate text-xs text-muted-foreground">{item.card.team ?? "—"}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
