"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardPicker } from "@/components/inventory/CardPicker";
import { ScanAddTab } from "@/components/inventory/ScanAddTab";
import { useAddToInventory, useAddWantItem } from "@/lib/queries/inventory";

export type AddTab = "search" | "scan";

export type AddCardList = "haves" | "wants";

// initialTab lets a caller deep-link straight into the scanner (/inventory/add
// ?tab=scan) — the home page's hero CTA does exactly that. It only seeds the
// initial state; the tabs are still freely switchable after that, and the URL
// deliberately doesn't track subsequent switches.
export function AddCardWorkflow({
  list = "haves",
  initialTab = "search",
}: {
  list?: AddCardList;
  initialTab?: AddTab;
}) {
  const [tab, setTab] = useState<AddTab>(initialTab);
  const addMutation = useAddToInventory();
  const addWantMutation = useAddWantItem();

  // Scanning identifies a card you're physically holding, which only makes
  // sense for a Have — so the Wants flow is the search picker on its own.
  if (list === "wants") {
    return (
      <CardPicker
        addLabel="Add to Wants"
        isAdding={addWantMutation.isPending}
        onAdd={(cardId) =>
          addWantMutation.mutate(cardId, {
            onSuccess: () => toast.success("Added to your want list."),
            onError: (error) => toast.error(error.message),
          })
        }
      />
    );
  }

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as AddTab)}>
      <TabsList className="w-full max-w-md">
        <TabsTrigger value="search">Search</TabsTrigger>
        <TabsTrigger value="scan">Scan a card</TabsTrigger>
      </TabsList>
      <TabsContent value="search" className="mt-4">
        <CardPicker
          addLabel="Add to Haves"
          isAdding={addMutation.isPending}
          onAdd={(cardId) =>
            addMutation.mutate(
              { cardId },
              {
                onSuccess: () => toast.success("Added to your inventory."),
                onError: (error) => toast.error(error.message),
              }
            )
          }
        />
      </TabsContent>
      <TabsContent value="scan" className="mt-4">
        <ScanAddTab onSwitchToSearch={() => setTab("search")} />
      </TabsContent>
    </Tabs>
  );
}
