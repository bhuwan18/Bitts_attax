import type { TraderWantItem } from "@/lib/queries/traders";

export function TraderWantList({ items }: { items: TraderWantItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No Wants listed yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item.id}
          className="clip-corner-sm bg-primary/15 px-2 py-1 text-xs font-medium text-primary"
        >
          {item.card.name}
        </span>
      ))}
    </div>
  );
}
