"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  HaveWantPicker,
  cardToOption,
  type CardOption,
  type PickedItem,
} from "@/components/trades/HaveWantPicker";
import { ListingPreview } from "@/components/trades/ListingPreview";
import { createTradeListing } from "@/app/(main)/trades/actions";
import { useInventory, useWantList } from "@/lib/queries/inventory";
import { useCurrentProfile } from "@/lib/queries/auth";

function sumValue(items: PickedItem[]): number {
  return items.reduce((total, i) => total + (i.basePrice ?? 0) * i.quantity, 0);
}

function balanceVerdict(offer: number, ask: number): { label: string; className: string } {
  if (offer <= 0 || ask <= 0) return { label: "", className: "" };
  const ratio = offer / ask;
  if (ratio >= 0.85 && ratio <= 1.18) return { label: "Looks balanced", className: "text-success" };
  if (ratio > 1.18) return { label: "You're offering more", className: "text-muted-foreground" };
  return { label: "You're asking for more", className: "text-muted-foreground" };
}

export function TradeListingForm() {
  const router = useRouter();
  const { data: inventory } = useInventory();
  const { data: wantList } = useWantList();
  const { data: profile } = useCurrentProfile();

  const [title, setTitle] = useState("");
  const [haves, setHaves] = useState<PickedItem[]>([]);
  const [wants, setWants] = useState<PickedItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Offer from what you own; want from what you're already chasing.
  const inventorySuggestions = useMemo<CardOption[]>(
    () =>
      (inventory ?? []).map((item) =>
        cardToOption(item.card, {
          maxQuantity: item.quantity,
          imageUrl: item.custom_image_url ?? item.card.image_url,
        })
      ),
    [inventory]
  );

  const wantSuggestions = useMemo<CardOption[]>(
    () => (wantList ?? []).map((item) => cardToOption(item.card)),
    [wantList]
  );

  const offeringValue = sumValue(haves);
  const askingValue = sumValue(wants);
  const showBalance =
    haves.length > 0 && wants.length > 0 && (offeringValue > 0 || askingValue > 0);
  const balance = balanceVerdict(offeringValue, askingValue);

  const missing =
    haves.length === 0 && wants.length === 0
      ? "Add cards to both sides to post your listing."
      : haves.length === 0
        ? "Add at least one card you're offering."
        : wants.length === 0
          ? "Add at least one card you want."
          : null;
  const canSubmit = !missing && !submitting;

  const ownerName = profile?.display_name ?? profile?.username ?? "Your";
  const showPreview = haves.length > 0 || wants.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (haves.length === 0 || wants.length === 0) return;

    setSubmitting(true);
    try {
      await createTradeListing({
        title: title.trim() || undefined,
        haves: haves.map(({ cardId, quantity }) => ({ cardId, quantity })),
        wants: wants.map(({ cardId, quantity }) => ({ cardId, quantity })),
      });
      toast.success("Listing created.");
      router.push("/trades");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create listing.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <HaveWantPicker
        label="Cards you're offering"
        hint="Pick from your collection, or search the full catalog."
        accent="success"
        items={haves}
        onChange={setHaves}
        suggestions={inventorySuggestions}
        suggestionsLabel="From your collection"
        suggestionsEmpty="Your collection is empty — search the catalog to add cards."
        searchPlaceholder="Search your cards or the catalog…"
      />

      <HaveWantPicker
        label="Cards you want in return"
        hint="Suggested from your want-list, or search for anything."
        accent="primary"
        items={wants}
        onChange={setWants}
        suggestions={wantSuggestions}
        suggestionsLabel="From your want-list"
        suggestionsEmpty="No want-list yet — search the catalog for cards you're after."
        searchPlaceholder="Search cards you want…"
      />

      {showBalance && (
        <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-xs">
          <Scale className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            Offering <b className="text-foreground">~{offeringValue.toLocaleString()}</b> · Asking{" "}
            <b className="text-foreground">~{askingValue.toLocaleString()}</b>
          </span>
          {balance.label && (
            <span className={cn("ml-auto font-medium", balance.className)}>{balance.label}</span>
          )}
        </div>
      )}

      {showPreview && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Preview</p>
          <ListingPreview title={title} haves={haves} wants={wants} ownerName={ownerName} />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          placeholder="e.g. Looking for Premier League legends"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
        <p className="text-xs text-muted-foreground">
          A short headline helps your listing stand out on the feed.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Button type="submit" disabled={!canSubmit} className="mt-1">
          {submitting ? "Creating…" : "Create listing"}
        </Button>
        {missing && !submitting && (
          <p className="text-center text-xs text-muted-foreground">{missing}</p>
        )}
      </div>
    </form>
  );
}
