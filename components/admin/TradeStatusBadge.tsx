import { cn } from "@/lib/utils";
import { TRADE_STATUS_STYLE } from "@/lib/trades/status";

export function TradeStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "clip-corner-sm inline-block px-2 py-0.5 font-heading text-[11px] font-bold tracking-wide uppercase",
        TRADE_STATUS_STYLE[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}
