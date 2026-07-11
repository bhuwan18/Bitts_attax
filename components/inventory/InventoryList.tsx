"use client";

import { toast } from "sonner";
import { CardPicker } from "@/components/inventory/CardPicker";
import { InventoryItemRow } from "@/components/inventory/InventoryItemRow";
import {
  useAddToInventory,
  useInventory,
  useRemoveInventoryItem,
  useUpdateInventoryQuantity,
} from "@/lib/queries/inventory";

export function InventoryList() {
  const { data: items, isLoading } = useInventory();
  const addMutation = useAddToInventory();
  const updateMutation = useUpdateInventoryQuantity();
  const removeMutation = useRemoveInventoryItem();

  return (
    <div className="flex flex-col gap-4">
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
      {isLoading && <p className="text-sm text-muted-foreground">Loading your collection…</p>}
      {!isLoading && items?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t added any cards yet. Search above to add your first one.
        </p>
      )}
      <div className="flex flex-col gap-2">
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
    </div>
  );
}
