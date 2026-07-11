"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2, Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardPicker } from "@/components/inventory/CardPicker";
import { WantItemTile } from "@/components/inventory/WantItemTile";
import { InventoryViewToggle, type InventoryView } from "@/components/inventory/InventoryViewToggle";
import { useAddWantItem, useRemoveWantItem, useWantList } from "@/lib/queries/inventory";

export function WantListEditor() {
  const [view, setView] = useState<InventoryView>("list");
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
        <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/60 py-10 text-center">
          <Heart className="size-7 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            Your want list is empty — search above for cards you&apos;re chasing.
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
        <div className="flex flex-col gap-2">
          {items?.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl bg-card p-2 ring-1 ring-border"
            >
              <div className="clip-corner-sm relative size-14 shrink-0 overflow-hidden bg-muted">
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
                <p className="truncate text-sm font-semibold">{item.card.name}</p>
                <p className="truncate text-xs text-muted-foreground">{item.card.team ?? "—"}</p>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Remove from want list"
                className="text-muted-foreground hover:text-destructive"
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
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items?.map((item) => (
            <WantItemTile
              key={item.id}
              item={item}
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
