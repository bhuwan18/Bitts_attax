import { cn } from "@/lib/utils";
import { TRADE_STATUS_STYLE } from "@/lib/trades/status";

export function TradeStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 font-sans text-[11px] font-extrabold tracking-wide uppercase",
        TRADE_STATUS_STYLE[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}
