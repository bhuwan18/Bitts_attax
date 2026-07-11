"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { proposeTrade } from "@/app/(main)/trades/actions";
import { useInventory } from "@/lib/queries/inventory";
import { useTraderInventory } from "@/lib/queries/traders";

interface PickedItem {
  cardId: string;
  name: string;
  quantity: number;
  maxQuantity: number;
}

export function ProposeTradeForm({ counterpartyId }: { counterpartyId: string }) {
  const router = useRouter();
  const { data: myInventory } = useInventory();
  const { data: theirInventory } = useTraderInventory(counterpartyId);

  const [myItems, setMyItems] = useState<PickedItem[]>([]);
  const [theirItems, setTheirItems] = useState<PickedItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
    <div className="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-border">
      <p className="font-heading text-base font-bold">Propose a trade</p>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <InventoryColumn
          label="Your offer"
          available={(myInventory ?? []).map((i) => ({
            cardId: i.card.id,
            name: i.card.name,
            team: i.card.team,
            maxQuantity: i.quantity,
          }))}
          picked={myItems}
          onChange={setMyItems}
        />
        <ArrowLeftRight className="mt-8 hidden size-4 shrink-0 text-muted-foreground sm:block" />
        <InventoryColumn
          label="Their items"
          available={(theirInventory ?? []).map((i) => ({
            cardId: i.card.id,
            name: i.card.name,
            team: i.card.team,
            maxQuantity: i.quantity,
          }))}
          picked={theirItems}
          onChange={setTheirItems}
        />
      </div>
      <Button disabled={submitting} onClick={handleSubmit} className="w-fit">
        {submitting ? "Sending…" : "Send trade request"}
      </Button>
    </div>
  );
}

function InventoryColumn({
  label,
  available,
  picked,
  onChange,
}: {
  label: string;
  available: { cardId: string; name: string; team: string | null; maxQuantity: number }[];
  picked: PickedItem[];
  onChange: (items: PickedItem[]) => void;
}) {
  const pickable = available.filter((a) => !picked.some((p) => p.cardId === a.cardId));

  function addItem(item: { cardId: string; name: string; maxQuantity: number }) {
    onChange([
      ...picked,
      { cardId: item.cardId, name: item.name, quantity: 1, maxQuantity: item.maxQuantity },
    ]);
  }

  function updateQuantity(cardId: string, quantity: number) {
    onChange(picked.map((p) => (p.cardId === cardId ? { ...p, quantity } : p)));
  }

  function removeItem(cardId: string) {
    onChange(picked.filter((p) => p.cardId !== cardId));
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{label}</p>

      <div className="flex flex-col gap-1.5">
        {picked.map((item) => (
          <div
            key={item.cardId}
            className="flex items-center gap-2 rounded-xl bg-muted/60 p-2 pl-3 ring-1 ring-border"
          >
            <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
            <QuantityStepper
              value={item.quantity}
              max={item.maxQuantity}
              onChange={(quantity) => updateQuantity(item.cardId, quantity)}
            />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => removeItem(item.cardId)}
              aria-label={`Remove ${item.name}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        {picked.length === 0 && (
          <p className="px-1 text-xs text-muted-foreground">Nothing added yet.</p>
        )}
      </div>

      {pickable.length > 0 && (
        <div className="flex max-h-40 flex-col divide-y divide-border overflow-y-auto rounded-xl bg-card ring-1 ring-border">
          {pickable.map((item) => (
            <button
              key={item.cardId}
              type="button"
              className="flex items-center justify-between gap-2 p-2.5 text-left text-sm transition-colors hover:bg-accent"
              onClick={() => addItem(item)}
            >
              <span className="truncate">
                {item.name}
                {item.team && <span className="text-muted-foreground"> — {item.team}</span>}
              </span>
              <Plus className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
