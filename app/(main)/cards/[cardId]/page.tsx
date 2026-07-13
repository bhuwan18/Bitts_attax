import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  RARITY_LABEL,
  RARITY_STYLE,
  RARITY_BORDER_CLASS,
  RARITY_GLOW_CLASS,
  FOIL_RARITIES,
} from "@/lib/cards/rarity";
import { createClient } from "@/lib/supabase/server";
import { CARDS_EFFECTIVE_RELATION } from "@/lib/queries/cardsShared";
import { AddToInventoryDialog } from "@/components/cards/AddToInventoryDialog";
import { WantListButton } from "@/components/cards/WantListButton";
import { Badge } from "@/components/ui/badge";
import { StatStrip } from "@/components/shared/StatStrip";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const supabase = await createClient();
  // cards_effective, not cards: same columns, but ovr_rating is coalesced onto
  // the LLM estimate so an unrated card still shows a rating here.
  const { data: card } = await supabase
    .from(CARDS_EFFECTIVE_RELATION)
    .select("*")
    .eq("id", cardId)
    .single();

  if (!card) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: existingItem }, { data: wantItem }] = user
    ? await Promise.all([
        supabase
          .from("inventory_items")
          .select("id, quantity, custom_image_url")
          .eq("card_id", cardId)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("want_items")
          .select("id")
          .eq("card_id", cardId)
          .eq("user_id", user.id)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }];

  const foil = FOIL_RARITIES.has(card.rarity);
  const heroImageUrl = existingItem?.custom_image_url ?? card.image_url;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <Link
        href="/cards"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to database
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div
          className={cn(
            "card-surface-gradient relative aspect-[3/4] w-full max-w-xs shrink-0 rounded-2xl border-4 sm:w-72",
            RARITY_BORDER_CLASS[card.rarity] ?? RARITY_BORDER_CLASS.other,
            RARITY_GLOW_CLASS[card.rarity] ?? RARITY_GLOW_CLASS.other,
            foil && "foil-sheen"
          )}
        >
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt={card.name}
              fill
              className="rounded-[calc(var(--radius-2xl)-4px)] object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
          {card.ovr_rating != null && (
            <div className="absolute top-0 left-0 rounded-lg bg-foreground/90 px-3.5 py-2 font-heading text-3xl leading-none text-background backdrop-blur-sm">
              {card.ovr_rating}
            </div>
          )}
          {existingItem?.custom_image_url && (
            <Badge variant="secondary" className="absolute bottom-2 left-2">
              Your photo
            </Badge>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div>
            <span
              className={cn(
                "mb-2 inline-block rounded-full px-2.5 py-1 font-sans text-xs font-extrabold tracking-wide uppercase",
                RARITY_STYLE[card.rarity] ?? RARITY_STYLE.other
              )}
            >
              {RARITY_LABEL[card.rarity] ?? card.rarity}
            </span>
            <h1 className="font-heading text-4xl leading-[0.95] tracking-tight">
              {card.name}
            </h1>
            <p className="mt-1 text-muted-foreground">{card.team ?? "Free agent"}</p>
          </div>

          <StatStrip
            items={[
              { label: "Position", value: card.position ?? "—" },
              { label: "Season", value: card.season ?? "—" },
              {
                label: "Base price",
                value: card.base_price != null ? `$${card.base_price.toFixed(2)}` : "—",
              },
            ]}
          />

          {card.set_name && (
            <p className="text-sm text-muted-foreground">
              From <span className="font-medium text-foreground">{card.set_name}</span>
            </p>
          )}

          <div className="flex flex-col gap-2 sm:items-start">
            <div className="flex flex-col gap-2 sm:flex-row">
              <AddToInventoryDialog card={card} existingItem={existingItem} />
              <WantListButton
                cardId={card.id}
                cardName={card.name}
                wantItemId={wantItem?.id ?? null}
              />
            </div>
            {existingItem && (
              <p className="text-xs text-muted-foreground">
                In your inventory · qty {existingItem.quantity}
              </p>
            )}
            {wantItem && <p className="text-xs text-muted-foreground">On your want list</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
