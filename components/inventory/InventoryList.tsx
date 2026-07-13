"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PackageOpen } from "lucide-react";
import { CardPicker } from "@/components/inventory/CardPicker";
import { ScanCardDialog } from "@/components/inventory/ScanCardDialog";
import { InventoryItemRow } from "@/components/inventory/InventoryItemRow";
import { InventoryItemTile } from "@/components/inventory/InventoryItemTile";
import { InventoryViewToggle, type InventoryView } from "@/components/inventory/InventoryViewToggle";
import {
  useAddToInventory,
  useInventory,
  useRemoveInventoryItem,
  useUpdateInventoryQuantity,
} from "@/lib/queries/inventory";

export function InventoryList() {
  const [view, setView] = useState<InventoryView>("grid");
  const { data: items, isLoading } = useInventory();
  const addMutation = useAddToInventory();
  const updateMutation = useUpdateInventoryQuantity();
  const removeMutation = useRemoveInventoryItem();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <CardPicker
          addLabel="Add to Haves"
          isAdding={addMutation.isPending}
          onAdd={(cardId) =>
            addMutation.mutate(
              { cardId },
              {
                onError: (error) => toast.error(error.message),
              }
            )
          }
        />
        <ScanCardDialog />
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading your collection…</p>}
      {!isLoading && items?.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/60 py-10 text-center">
          <PackageOpen className="size-7 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            No cards yet — search above to add your first Have.
          </p>
        </div>
      )}
      {!isLoading && items && items.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            {items.length} card{items.length === 1 ? "" : "s"}
          </p>
          <InventoryViewToggle view={view} onChange={setView} />
        </div>
      )}
      {view === "list" ? (
        // Two columns on tablet+ so rows fill the width instead of leaving a
        // huge gap between the card name and the quantity stepper.
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {items?.map((item) => (
            <InventoryItemRow
              key={item.id}
              item={item}
              onUpdateQuantity={(quantity) =>
                updateMutation.mutate(
                  { itemId: item.id, quantity },
                  { onError: (error) => toast.error(error.message) }
                )
              }
              onRemove={() =>
                removeMutation.mutate(item.id, {
                  onError: (error) => toast.error(error.message),
                })
              }
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {items?.map((item) => (
            <InventoryItemTile
              key={item.id}
              item={item}
              onUpdateQuantity={(quantity) =>
                updateMutation.mutate(
                  { itemId: item.id, quantity },
                  { onError: (error) => toast.error(error.message) }
                )
              }
              onRemove={() =>
                removeMutation.mutate(item.id, {
                  onError: (error) => toast.error(error.message),
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
