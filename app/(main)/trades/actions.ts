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

  // A direct proposal (no listing) is the proposer asserting what the other
  // person owns, read off their public inventory — so check the assertion still
  // holds, since they could have traded the card away since the page loaded.
  // A listing-backed proposal is the owner's own posted terms being accepted
  // as-is; those aren't the proposer's claim to validate, and a listing may name
  // cards the owner never held (createTradeListing lets them pick any card in
  // the catalog, not just their inventory).
  if (parsed.listingId === null && parsed.theirItems.length > 0) {
    const { data: theirInventory, error: inventoryError } = await supabase
      .from("inventory_items")
      .select("card_id, quantity")
      .eq("user_id", parsed.counterpartyId)
      .in(
        "card_id",
        parsed.theirItems.map((i) => i.cardId)
      );

    if (inventoryError) throw new Error(inventoryError.message);

    const held = new Map((theirInventory ?? []).map((i) => [i.card_id, i.quantity]));
    const unavailable = parsed.theirItems.filter(
      (i) => (held.get(i.cardId) ?? 0) < i.quantity
    );

    if (unavailable.length > 0) {
      throw new Error(
        "They don't have enough of some cards you asked for. Refresh their profile and try again."
      );
    }
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

  const { error: itemsError } = await supabase.from("trade_items").insert(items);
  if (itemsError) throw new Error(itemsError.message);

  revalidatePath("/trades");
  // The trader's profile marks cards already in an outgoing request.
  revalidatePath(`/traders/${parsed.counterpartyId}`);
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
