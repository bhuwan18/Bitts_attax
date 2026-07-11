import Link from "next/link";
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
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trade Listings</h1>
        <Button size="sm" render={<Link href="/trades/new" />}>
          New listing
        </Button>
      </div>
      <TradeBrowseList currentUserId={user?.id ?? null} />
    </div>
  );
}
