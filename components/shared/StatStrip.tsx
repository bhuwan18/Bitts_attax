import { cn } from "@/lib/utils";

export interface StatStripItem {
  label: string;
  value: string | number;
  /** Tailwind text-color class for the number, e.g. "text-primary". Only used in "lg" mode. */
  accent?: string;
}

export function StatStrip({
  items,
  size = "sm",
}: {
  items: StatStripItem[];
  size?: "sm" | "lg";
}) {
  if (size === "lg") {
    return (
      <dl className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col gap-1 rounded-2xl bg-card p-4 ring-1 ring-border transition-transform duration-300 ease-[var(--ease-out-quint)] hover:-translate-y-1 hover:ring-foreground/20"
          >
            <dd className={cn("font-heading text-4xl leading-none", item.accent)}>{item.value}</dd>
            <dt className="text-[11px] font-extrabold tracking-wide text-muted-foreground uppercase">
              {item.label}
            </dt>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5 bg-card px-3 py-2.5">
          <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {item.label}
          </dt>
          <dd className="font-heading text-lg leading-none">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
