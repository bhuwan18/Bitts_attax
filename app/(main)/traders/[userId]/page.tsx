import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatStrip } from "@/components/shared/StatStrip";
import { TraderInventoryGrid } from "@/components/traders/TraderInventoryGrid";
import { TraderWantList } from "@/components/traders/TraderWantList";
import { ProposeTradeForm } from "@/components/traders/ProposeTradeForm";
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
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="bg-primary font-heading text-2xl font-extrabold text-primary-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">{name}</h1>
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
        <h2 className="font-heading text-lg font-bold tracking-tight">Haves</h2>
        <TraderInventoryGrid items={items} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-bold tracking-tight">Wants</h2>
        <TraderWantList items={wantItems} />
      </div>

      <ProposeTradeForm counterpartyId={userId} />
    </div>
  );
}
