"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HaveWantPicker,
  cardToOption,
  type CardOption,
} from "@/components/trades/HaveWantPicker";
import { proposeTrade } from "@/app/(main)/trades/actions";
import { useInventory } from "@/lib/queries/inventory";
import { useTradeDraft } from "@/components/traders/TradeDraftProvider";
import type { TraderInventoryItem, TraderWantItem } from "@/lib/queries/traders";

export const PROPOSE_TRADE_FORM_ID = "propose-trade";

export function ProposeTradeForm({
  counterpartyId,
  traderName,
  traderInventory,
  traderWants,
}: {
  counterpartyId: string;
  traderName: string;
  traderInventory: TraderInventoryItem[];
  traderWants: TraderWantItem[];
}) {
  const router = useRouter();
  const { myItems, theirItems, setMyItems, setTheirItems } = useTradeDraft();
  const { data: myInventory } = useInventory();
  const [submitting, setSubmitting] = useState(false);

  const wantedByThem = new Set(traderWants.map((w) => w.card.id));

  // Your cards they're actually asking for float to the top — those are the
  // offers most likely to get a yes.
  const myOptions: CardOption[] = (myInventory ?? [])
    .map((i) =>
      cardToOption(i.card, {
        maxQuantity: i.quantity,
        imageUrl: i.custom_image_url ?? i.card.image_url,
      })
    )
    .sort(
      (a, b) => Number(wantedByThem.has(b.cardId)) - Number(wantedByThem.has(a.cardId))
    );

  const theirOptions: CardOption[] = traderInventory.map((i) =>
    cardToOption(i.card, {
      maxQuantity: i.quantity,
      imageUrl: i.custom_image_url ?? i.card.image_url,
    })
  );

  async function handleSubmit() {
    if (myItems.length === 0 && theirItems.length === 0) {
      toast.error("Add at least one card to offer or request.");
      return;
    }

    setSubmitting(true);
    try {
      const { tradeId } = await proposeTrade({
        listingId: null,
        counterpartyId,
        myItems: myItems.map((i) => ({ cardId: i.cardId, quantity: i.quantity })),
        theirItems: theirItems.map((i) => ({ cardId: i.cardId, quantity: i.quantity })),
      });
      router.push(`/trades/${tradeId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to propose trade.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      id={PROPOSE_TRADE_FORM_ID}
      className="flex scroll-mt-20 flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-border"
    >
      <p className="font-heading text-base">Propose a trade</p>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <HaveWantPicker
          label="Your offer"
          hint="Cards they want are listed first."
          accent="success"
          items={myItems}
          onChange={setMyItems}
          suggestions={myOptions}
          suggestionsLabel="From your inventory"
          suggestionsEmpty="Your inventory is empty."
          searchPlaceholder="Search your cards or the catalog…"
        />

        <ArrowLeftRight className="mt-9 hidden size-4 shrink-0 self-start text-muted-foreground sm:block" />

        {/* Scoped to their Haves: requesting a card they don't own would just be
            rejected by proposeTrade, so it isn't offered as a choice. */}
        <HaveWantPicker
          label={`${traderName}'s cards`}
          hint="Or tap any card in their Haves above."
          items={theirItems}
          onChange={setTheirItems}
          suggestions={theirOptions}
          suggestionsLabel="From their Haves"
          suggestionsEmpty="They have no cards listed."
          searchPlaceholder="Search their cards…"
          searchScope="suggestions"
        />
      </div>

      <Button disabled={submitting} onClick={handleSubmit} className="w-fit">
        {submitting ? "Sending…" : "Send trade request"}
      </Button>
    </div>
  );
}
