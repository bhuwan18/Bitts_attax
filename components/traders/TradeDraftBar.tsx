"use client";

import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTradeDraft } from "@/components/traders/TradeDraftProvider";
import { PROPOSE_TRADE_FORM_ID } from "@/components/traders/ProposeTradeForm";

/**
 * Running total of the trade you're assembling by tapping cards, with a jump to
 * the form to finish it. Floats above BottomNav (which is fixed at z-40 and
 * ~8rem tall, per the pb on <main> in app/(main)/layout.tsx).
 */
export function TradeDraftBar() {
  const { myItems, theirItems } = useTradeDraft();

  if (myItems.length === 0 && theirItems.length === 0) return null;

  return (
    <>
      {/* Keeps the bar from covering the end of the page's own content. */}
      <div aria-hidden className="h-16" />

      <div className="fixed inset-x-3 bottom-[calc(8.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10 nav-float-glow">
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-semibold">
            {theirItems.length} requested
          </span>
          <span className="text-muted-foreground"> · {myItems.length} offered</span>
        </p>
        <Button
          size="sm"
          onClick={() =>
            document
              .getElementById(PROPOSE_TRADE_FORM_ID)
              ?.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        >
          <ArrowDown className="size-4" />
          Review &amp; send
        </Button>
      </div>
    </>
  );
}
