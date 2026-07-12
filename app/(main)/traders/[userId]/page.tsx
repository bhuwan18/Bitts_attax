import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatStrip } from "@/components/shared/StatStrip";
import { TraderInventoryGrid } from "@/components/traders/TraderInventoryGrid";
import { TraderWantList } from "@/components/traders/TraderWantList";
import { ProposeTradeForm } from "@/components/traders/ProposeTradeForm";
import { TradeDraftProvider } from "@/components/traders/TradeDraftProvider";
import { TradeDraftBar } from "@/components/traders/TradeDraftBar";
import type { TraderInventoryItem, TraderWantItem } from "@/lib/queries/traders";

export default async function TraderDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id === userId) redirect("/profile");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (!profile) notFound();

  const { data: inventory } = await supabase
    .from("inventory_items")
    .select("id, quantity, custom_image_url, card:cards(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const { data: wants } = await supabase
    .from("want_items")
    .select("id, priority, card:cards(*)")
    .eq("user_id", userId)
    .order("priority", { ascending: false });

  const items = (inventory ?? []) as unknown as TraderInventoryItem[];
  const wantItems = (wants ?? []) as unknown as TraderWantItem[];
  const name = profile.display_name ?? profile.username;
  const initial = name.charAt(0).toUpperCase();

  return (
    // The grid and the propose form both read/write one trade draft — tapping a
    // card in Haves is what puts it in the form's request column.
    <TradeDraftProvider counterpartyId={userId}>
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={name} />}
            <AvatarFallback className="bg-primary font-heading text-2xl text-primary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-2xl tracking-tight">{name}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
        </div>

        <StatStrip
          items={[
            { label: "Haves", value: items.length },
            { label: "Wants", value: wantItems.length },
          ]}
        />

        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-lg tracking-tight">Haves</h2>
          <p className="-mt-1 text-sm text-muted-foreground">
            Tap a card to see it and ask for it.
          </p>
          <TraderInventoryGrid items={items} traderName={name} />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-lg tracking-tight">Wants</h2>
          <TraderWantList items={wantItems} />
        </div>

        <ProposeTradeForm
          counterpartyId={userId}
          traderName={name}
          traderInventory={items}
          traderWants={wantItems}
        />

        <TradeDraftBar />
      </div>
    </TradeDraftProvider>
  );
}
