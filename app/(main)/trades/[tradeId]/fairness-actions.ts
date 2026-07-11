"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { computeFairnessScore, type FairnessConfig, type FairnessResult } from "@/lib/fairness";
import type { Rarity } from "@/lib/types/database.types";

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
export async function computeAndPersistFairness(tradeId: string): Promise<FairnessResult> {
  const parsedTradeId = z.uuid().parse(tradeId);
  const supabase = await createClient();

  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .select("id, initiator_id, counterparty_id")
    .eq("id", parsedTradeId)
    .single();

  if (tradeError || !trade) throw new Error(tradeError?.message ?? "Trade not found.");

  const { data: items, error: itemsError } = await supabase
    .from("trade_items")
    .select("offered_by, quantity, card:cards(base_price, rarity, ovr_rating)")
    .eq("trade_id", parsedTradeId);

  if (itemsError) throw new Error(itemsError.message);

  const config = await loadActiveFairnessConfig(supabase);

  type ItemRow = {
    offered_by: string;
    quantity: number;
    card: { base_price: number | null; rarity: Rarity; ovr_rating: number | null } | null;
  };

  const toFairnessInputs = (offeredBy: string) =>
    ((items ?? []) as unknown as ItemRow[])
      .filter((item) => item.offered_by === offeredBy)
      .map((item) => ({
        basePrice: item.card?.base_price ?? 0,
        rarity: item.card?.rarity ?? "other",
        ovrRating: item.card?.ovr_rating ?? 0,
        quantity: item.quantity,
      }));

  const sideA = toFairnessInputs(trade.initiator_id);
  const sideB = toFairnessInputs(trade.counterparty_id);

  const result = computeFairnessScore(sideA, sideB, config);

  const { error: updateError } = await supabase
    .from("trades")
    .update({
      fairness_score: result.score,
      fairness_breakdown: result as unknown as Record<string, unknown>,
    })
    .eq("id", parsedTradeId);

  if (updateError) throw new Error(updateError.message);

  return result;
}
