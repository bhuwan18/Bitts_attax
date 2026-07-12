"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { CreateListingSchema, ProposeTradeSchema } from "@/lib/validation/trade.schema";
import { evaluateAchievements } from "@/app/(main)/gamification/actions";

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

// "completed" is deliberately not settable here — see confirmTradeCompletion
// below, which requires both participants to confirm before the status
// actually flips (and RPC-triggers the inventory transfer).
const TradeStatusSchema = z.enum(["accepted", "rejected", "cancelled"]);

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

// Requires both the initiator and counterparty to independently call this
// (they've physically met and exchanged cards) before the trade's status
// flips to "completed" — see confirm_trade_completion() in
// supabase/migrations/0015_trade_completion_confirmations.sql for the
// race-safe confirmation logic and the trigger that then transfers the
// traded cards between both parties' inventories. Safe to call again after
// your own confirmation is already recorded — it's a no-op until the other
// party also confirms.
export async function confirmTradeCompletion(tradeId: string): Promise<{ status: string }> {
  const parsedTradeId = z.uuid().parse(tradeId);
  const { supabase } = await requireUser();

  const { data, error } = await supabase.rpc("confirm_trade_completion", {
    p_trade_id: parsedTradeId,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/trades/${parsedTradeId}`);
  revalidatePath("/trades");
  revalidatePath("/inventory");

  const status = data?.status ?? "accepted";

  // Only the calling participant's achievements can be evaluated here — a
  // Server Action only has this session's identity, never the other party's
  // (and never a service-role client, per this app's trust model). The other
  // participant's newly-completed-trade achievement gets caught by
  // AchievementEvaluator the next time they load their own Profile page.
  if (status === "completed") {
    await evaluateAchievements();
  }

  return { status };
}
