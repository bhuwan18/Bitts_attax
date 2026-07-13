"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { computeFairnessScore, type FairnessConfig, type FairnessResult } from "@/lib/fairness";
import { resolveOvrRatings } from "@/lib/cards/ovrResolver";
import type { Card, Json, Rarity } from "@/lib/types/database.types";

async function loadActiveFairnessConfig(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<FairnessConfig> {
  const { data, error } = await supabase
    .from("fairness_rules")
    .select("*")
    .eq("key", "default")
    .eq("is_active", true)
    .single();

  if (error || !data) throw new Error(error?.message ?? "No active fairness configuration found.");

  return {
    rarityWeights: data.rarity_weights as Record<Rarity, number>,
    ovrWeight: data.ovr_weight,
    priceWeight: data.price_weight,
    tolerancePct: data.tolerance_pct,
  };
}

// Computes the fairness score for a trade and persists it onto `trades`.
// Callable both by participants viewing the trade (RLS restricts trade_items
// visibility to the two parties) and safely re-runnable any time the trade's
// items change.
//
// Any card in the trade that the catalog has no ovr_rating for gets one
// generated here, on the spot, before scoring (lib/cards/ovrResolver.ts). That
// closes a real scoring bug rather than adding a nicety: OVR is a weighted term
// in computeFairnessScore, so an unrated card used to be scored as OVR 0 — i.e.
// as contributing nothing — which silently understated whichever side was
// holding it. Estimates are cached in the shared card_ovr_estimates table, so
// the Gemini call happens once per card across the whole app, not once per
// trade.
export async function computeAndPersistFairness(tradeId: string): Promise<FairnessResult> {
  const parsedTradeId = z.uuid().parse(tradeId);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in.");

  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .select("id, initiator_id, counterparty_id")
    .eq("id", parsedTradeId)
    .single();

  if (tradeError || !trade) throw new Error(tradeError?.message ?? "Trade not found.");

  const { data: items, error: itemsError } = await supabase
    .from("trade_items")
    .select(
      "offered_by, quantity, card:cards(id, name, team, position, rarity, set_name, season, image_url, base_price, ovr_rating)"
    )
    .eq("trade_id", parsedTradeId);

  if (itemsError) throw new Error(itemsError.message);

  const config = await loadActiveFairnessConfig(supabase);

  type ItemCard = Pick<
    Card,
    | "id"
    | "name"
    | "team"
    | "position"
    | "rarity"
    | "set_name"
    | "season"
    | "image_url"
    | "base_price"
    | "ovr_rating"
  >;
  type ItemRow = {
    offered_by: string;
    quantity: number;
    card: ItemCard | null;
  };

  const rows = (items ?? []) as unknown as ItemRow[];

  // Fills gaps only — a card the catalog already rates is left alone, and a
  // card that still can't be rated (Gemini down, or the model declined) is
  // simply absent from the map and falls back to the old `?? 0`. So a failure
  // here degrades to the previous behavior instead of blocking the trade view.
  const { ratings } = await resolveOvrRatings(
    supabase,
    user.id,
    rows.map((row) => row.card).filter((card): card is ItemCard => card !== null)
  );

  const toFairnessInputs = (offeredBy: string) =>
    rows
      .filter((item) => item.offered_by === offeredBy)
      .map((item) => ({
        basePrice: item.card?.base_price ?? 0,
        rarity: item.card?.rarity ?? "other",
        ovrRating:
          item.card?.ovr_rating ?? (item.card ? ratings.get(item.card.id) : undefined) ?? 0,
        quantity: item.quantity,
      }));

  const sideA = toFairnessInputs(trade.initiator_id);
  const sideB = toFairnessInputs(trade.counterparty_id);

  const result = computeFairnessScore(sideA, sideB, config);

  const { error: updateError } = await supabase
    .from("trades")
    .update({
      fairness_score: result.score,
      fairness_breakdown: result as unknown as Json,
    })
    .eq("id", parsedTradeId);

  if (updateError) throw new Error(updateError.message);

  return result;
}
