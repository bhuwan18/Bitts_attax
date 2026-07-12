import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TradeBrowseList } from "@/components/trades/TradeBrowseList";
import { MyTradesList } from "@/components/trades/MyTradesList";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Trades — Bitts Attax",
};

export default async function TradesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl tracking-tight">Trades</h1>
          <p className="text-sm text-muted-foreground">Open offers, plus trades you&apos;re part of.</p>
        </div>
        <Button size="sm" render={<Link href="/trades/new" />}>
          <Plus className="size-4" />
          New listing
        </Button>
      </div>
      <Tabs defaultValue="browse">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="mine">My Trades</TabsTrigger>
        </TabsList>
        <TabsContent value="browse" className="mt-4">
          <TradeBrowseList currentUserId={user?.id ?? null} />
        </TabsContent>
        <TabsContent value="mine" className="mt-4">
          <MyTradesList currentUserId={user?.id ?? null} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
