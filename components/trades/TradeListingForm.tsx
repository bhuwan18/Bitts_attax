"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HaveWantPicker, type PickedItem } from "@/components/trades/HaveWantPicker";
import { createTradeListing } from "@/app/(main)/trades/actions";

export function TradeListingForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [haves, setHaves] = useState<PickedItem[]>([]);
  const [wants, setWants] = useState<PickedItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (haves.length === 0 || wants.length === 0) {
      toast.error("Add at least one card to both Haves and Wants.");
      return;
    }

    setSubmitting(true);
    try {
      await createTradeListing({
        title: title || undefined,
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          placeholder="e.g. Looking for Premier League legends"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <HaveWantPicker label="Haves — cards you're offering" items={haves} onChange={setHaves} />
      <HaveWantPicker label="Wants — cards you're after" items={wants} onChange={setWants} />
      <Button type="submit" disabled={submitting} className="mt-1">
        {submitting ? "Creating…" : "Create listing"}
      </Button>
    </form>
  );
}
