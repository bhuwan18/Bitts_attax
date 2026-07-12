import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TradeBrowseList } from "@/components/trades/TradeBrowseList";
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
          <h1 className="font-heading text-3xl tracking-tight">Trade Listings</h1>
          <p className="text-sm text-muted-foreground">Open offers from other collectors.</p>
        </div>
        <Button size="sm" render={<Link href="/trades/new" />}>
          <Plus className="size-4" />
          New listing
        </Button>
      </div>
      <TradeBrowseList currentUserId={user?.id ?? null} />
    </div>
  );
}
