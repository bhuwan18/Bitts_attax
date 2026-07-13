"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Heart, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WantItemTile } from "@/components/inventory/WantItemTile";
import { InventoryViewToggle, type InventoryView } from "@/components/inventory/InventoryViewToggle";
import { useRemoveWantItem, useWantList } from "@/lib/queries/inventory";

export function WantListEditor() {
  const [view, setView] = useState<InventoryView>("grid");
  const { data: items, isLoading } = useWantList();
  const removeMutation = useRemoveWantItem();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/inventory/add?list=wants">
          <Button type="button" variant="outline" className="w-full sm:w-auto">
            <Plus className="size-4" />
            Add a card
          </Button>
        </Link>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading your want list…</p>}
      {!isLoading && items?.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/60 py-10 text-center">
          <Heart className="size-7 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            Your want list is empty — add the cards you&apos;re chasing.
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
        // huge gap between the card name and the remove button.
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {items?.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl bg-card p-2 ring-1 ring-border"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
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
