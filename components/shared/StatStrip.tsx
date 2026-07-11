import { cn } from "@/lib/utils";

export function StatStrip({
  items,
  size = "sm",
}: {
  items: { label: string; value: string | number }[];
  size?: "sm" | "lg";
}) {
  return (
    <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5 bg-card px-3 py-2.5">
          <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {item.label}
          </dt>
          <dd
            className={cn("font-heading leading-none font-bold", size === "lg" ? "text-3xl" : "text-lg")}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
