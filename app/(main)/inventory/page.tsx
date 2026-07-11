import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryList } from "@/components/inventory/InventoryList";
import { WantListEditor } from "@/components/inventory/WantListEditor";

export const metadata = {
  title: "Inventory — Bitts Attax",
};

export default function InventoryPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Your Collection</h1>
      <Tabs defaultValue="haves">
        <TabsList>
          <TabsTrigger value="haves">Haves</TabsTrigger>
          <TabsTrigger value="wants">Wants</TabsTrigger>
        </TabsList>
        <TabsContent value="haves">
          <InventoryList />
        </TabsContent>
        <TabsContent value="wants">
          <WantListEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
