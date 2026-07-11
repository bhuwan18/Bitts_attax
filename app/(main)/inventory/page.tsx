import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryList } from "@/components/inventory/InventoryList";
import { WantListEditor } from "@/components/inventory/WantListEditor";

export const metadata = {
  title: "Inventory — Bitts Attax",
};

export default function InventoryPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Your Collection</h1>
        <p className="text-sm text-muted-foreground">Track what you&apos;ve got and what you&apos;re chasing.</p>
      </div>
      <Tabs defaultValue="haves">
        <TabsList className="w-full">
          <TabsTrigger value="haves">Haves</TabsTrigger>
          <TabsTrigger value="wants">Wants</TabsTrigger>
        </TabsList>
        <TabsContent value="haves" className="mt-4">
          <InventoryList />
        </TabsContent>
        <TabsContent value="wants" className="mt-4">
          <WantListEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
