"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardPicker } from "@/components/inventory/CardPicker";
import { useAddWantItem, useRemoveWantItem, useWantList } from "@/lib/queries/inventory";

export function WantListEditor() {
  const { data: items, isLoading } = useWantList();
  const addMutation = useAddWantItem();
  const removeMutation = useRemoveWantItem();

  return (
    <div className="flex flex-col gap-4">
      <CardPicker
        addLabel="Add to Wants"
        isAdding={addMutation.isPending}
        onAdd={(cardId) =>
          addMutation.mutate(cardId, {
            onError: (error) => toast.error(error.message),
          })
        }
      />
      {isLoading && <p className="text-sm text-muted-foreground">Loading your want list…</p>}
      {!isLoading && items?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Your want list is empty. Search above to add cards you&apos;re after.
        </p>
      )}
      <div className="flex flex-col gap-2">
        {items?.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-md border p-2">
            <div className="relative size-12 shrink-0 overflow-hidden rounded bg-muted">
              {item.card.image_url && (
                <Image
                  src={item.card.image_url}
                  alt={item.card.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.card.name}</p>
              <p className="truncate text-xs text-muted-foreground">{item.card.team ?? "—"}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Remove from want list"
              onClick={() =>
                removeMutation.mutate(item.id, {
                  onError: (error) => toast.error(error.message),
                })
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
