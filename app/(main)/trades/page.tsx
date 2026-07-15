import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TradeBrowseList } from "@/components/trades/TradeBrowseList";
import { MyTradesList } from "@/components/trades/MyTradesList";
import { HelpButton } from "@/components/tour/HelpButton";
import { TourAutoStart } from "@/components/tour/TourAutoStart";

export const metadata = {
  title: "Trades — Bitts Attax",
};

// Deliberately not an async Server Component — same reasoning as the Home page.
// The getUser() call this used to make existed only to hand `currentUserId`
// down to the two lists, but it made the route dynamic, so <Link> couldn't
// prefetch it and every tap on the Trades pill paid a Supabase round-trip
// before anything rendered. Both lists now read the user from useCurrentUser()
// alongside the TanStack queries they were already running.
export default function TradesPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 p-4 sm:p-6">
      <TourAutoStart tourId="trades-list" />
      <div className="flex items-center justify-between gap-3">
        <div data-tour="trades-intro">
          <h1 className="font-heading text-3xl tracking-tight">Trades</h1>
          <p className="text-sm text-muted-foreground">Open offers, plus trades you&apos;re part of.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <HelpButton tourId="trades-list" label="Take the trades tour" />
          <Button size="sm" data-tour="trades-new-listing" render={<Link href="/trades/new" />}>
            <Plus className="size-4" />
            New listing
          </Button>
        </div>
      </div>
      <Tabs defaultValue="browse">
        <TabsList data-tour="trades-tabs" className="w-full max-w-md">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="mine">My Trades</TabsTrigger>
        </TabsList>
        <TabsContent value="browse" className="mt-4">
          <TradeBrowseList />
        </TabsContent>
        <TabsContent value="mine" className="mt-4">
          <MyTradesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
