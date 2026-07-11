import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const supabase = await createClient();
  const { data: card } = await supabase.from("cards").select("*").eq("id", cardId).single();

  if (!card) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:flex-row">
      <div className="relative aspect-[3/4] w-full max-w-xs overflow-hidden rounded-lg bg-muted sm:w-64">
        {card.image_url ? (
          <Image src={card.image_url} alt={card.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <h1 className="text-2xl font-semibold">{card.name}</h1>
        <p className="text-muted-foreground">{card.team ?? "Free agent"}</p>
        <div className="flex flex-wrap gap-2">
          <Badge>{card.rarity.replace("_", " ")}</Badge>
          {card.position && <Badge variant="outline">{card.position}</Badge>}
          {card.set_name && <Badge variant="outline">{card.set_name}</Badge>}
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">OVR</dt>
          <dd>{card.ovr_rating ?? "—"}</dd>
          <dt className="text-muted-foreground">Base price</dt>
          <dd>{card.base_price != null ? `$${card.base_price.toFixed(2)}` : "—"}</dd>
          <dt className="text-muted-foreground">Season</dt>
          <dd>{card.season ?? "—"}</dd>
        </dl>
      </div>
    </div>
  );
}
