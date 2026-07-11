"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { CreateListingSchema, ProposeTradeSchema } from "@/lib/validation/trade.schema";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in.");
  return { supabase, user };
}

export async function createTradeListing(input: z.infer<typeof CreateListingSchema>) {
  const parsed = CreateListingSchema.parse(input);
  const { supabase, user } = await requireUser();

  const { data: listing, error: listingError } = await supabase
    .from("trade_listings")
    .insert({ owner_id: user.id, title: parsed.title ?? null })
    .select("id")
    .single();

  if (listingError || !listing) throw new Error(listingError?.message ?? "Failed to create listing.");

  const items = [
    ...parsed.haves.map((h) => ({
      listing_id: listing.id,
      card_id: h.cardId,
      side: "have" as const,
      quantity: h.quantity,
    })),
    ...parsed.wants.map((w) => ({
      listing_id: listing.id,
      card_id: w.cardId,
      side: "want" as const,
      quantity: w.quantity,
    })),
  ];

  const { error: itemsError } = await supabase.from("trade_listing_items").insert(items);
  if (itemsError) throw new Error(itemsError.message);

  revalidatePath("/trades");
  return { listingId: listing.id as string };
}

export async function proposeTrade(input: z.infer<typeof ProposeTradeSchema>) {
  const parsed = ProposeTradeSchema.parse(input);
  const { supabase, user } = await requireUser();

  if (parsed.counterpartyId === user.id) {
    throw new Error("You can't propose a trade with yourself.");
  }

  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .insert({
      listing_id: parsed.listingId,
      initiator_id: user.id,
      counterparty_id: parsed.counterpartyId,
    })
    .select("id")
    .single();

  if (tradeError || !trade) throw new Error(tradeError?.message ?? "Failed to create trade.");

  const items = [
    ...parsed.myItems.map((i) => ({
      trade_id: trade.id,
      offered_by: user.id,
      card_id: i.cardId,
      quantity: i.quantity,
    })),
    ...parsed.theirItems.map((i) => ({
      trade_id: trade.id,
      offered_by: parsed.counterpartyId,
      card_id: i.cardId,
      quantity: i.quantity,
    })),
  ];

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from("trade_items").insert(items);
    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath("/trades");
  return { tradeId: trade.id as string };
}

const TradeStatusSchema = z.enum(["accepted", "rejected", "completed", "cancelled"]);

export async function updateTradeStatus(tradeId: string, status: z.infer<typeof TradeStatusSchema>) {
  const parsedTradeId = z.uuid().parse(tradeId);
  const parsedStatus = TradeStatusSchema.parse(status);
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("trades")
    .update({ status: parsedStatus })
    .eq("id", parsedTradeId);

  if (error) throw new Error(error.message);
  revalidatePath(`/trades/${parsedTradeId}`);
}
