"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { computeCurrentStreak } from "@/lib/gamification/streak";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in.");
  return { supabase, user };
}

// YYYY-MM-DD, not a future date, not implausibly old — guards against a
// wildly wrong client clock without needing perfect validation for what's a
// cosmetic feature. The date is client-supplied (rather than computed here
// in server UTC) so a streak doesn't miscount for users far from UTC, e.g.
// an evening session near midnight landing on the "wrong" calendar day.
const LocalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return false;
    const oneDayMs = 86_400_000;
    const now = Date.now();
    return date.getTime() <= now + oneDayMs && date.getTime() >= now - 365 * oneDayMs;
  }, "Date must be within the last year and not in the future.");

const RARE_OR_BETTER = new Set(["rare", "super_rare", "legend", "limited"]);

export async function recordDailyActivity(localDate: string) {
  const parsedDate = LocalDateSchema.parse(localDate);
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("activity_log")
    .upsert(
      { user_id: user.id, activity_date: parsedDate },
      { onConflict: "user_id,activity_date", ignoreDuplicates: true }
    );
  if (error) throw new Error(error.message);

  return evaluateAchievements();
}

// Diffs real counts (completed trades, rarity ownership, streak) against the
// caller's existing unlocks and inserts any newly-qualifying achievements.
// Called after key events (trade completed, card added, daily activity
// recorded) plus once on Profile mount as a safety net — see
// components/profile/AchievementEvaluator.tsx.
export async function evaluateAchievements() {
  const { supabase, user } = await requireUser();

  const [tradesResult, inventoryResult, activityResult, unlockedResult] = await Promise.all([
    supabase
      .from("trades")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .or(`initiator_id.eq.${user.id},counterparty_id.eq.${user.id}`),
    supabase.from("inventory_items").select("card:cards(rarity)").eq("user_id", user.id),
    supabase
      .from("activity_log")
      .select("activity_date")
      .eq("user_id", user.id)
      .order("activity_date", { ascending: false }),
    supabase.from("user_achievements").select("achievement_id").eq("user_id", user.id),
  ]);

  if (tradesResult.error) throw new Error(tradesResult.error.message);
  if (inventoryResult.error) throw new Error(inventoryResult.error.message);
  if (activityResult.error) throw new Error(activityResult.error.message);
  if (unlockedResult.error) throw new Error(unlockedResult.error.message);

  const tradesCompleted = tradesResult.count ?? 0;

  const inventoryRows = (inventoryResult.data ?? []) as unknown as {
    card: { rarity: string } | null;
  }[];
  const hasRareOrBetter = inventoryRows.some(
    (row) => !!row.card && RARE_OR_BETTER.has(row.card.rarity)
  );

  // Server-evaluated "today" — a day off near a timezone boundary is an
  // acceptable imprecision for this cosmetic feature (same trust model as
  // the client-supplied date above), not worth threading localDate through
  // every trigger point that has no client date available at all.
  const today = new Date().toISOString().slice(0, 10);
  const streak = computeCurrentStreak(
    (activityResult.data ?? []).map((row) => row.activity_date),
    today
  );

  const alreadyUnlocked = new Set((unlockedResult.data ?? []).map((row) => row.achievement_id));
  const newlyQualifying: string[] = [];
  if (tradesCompleted >= 1 && !alreadyUnlocked.has("first_trade")) {
    newlyQualifying.push("first_trade");
  }
  if (hasRareOrBetter && !alreadyUnlocked.has("rare_hunter")) {
    newlyQualifying.push("rare_hunter");
  }
  if (streak >= 5 && !alreadyUnlocked.has("streak_5")) {
    newlyQualifying.push("streak_5");
  }
  if (tradesCompleted >= 3 && !alreadyUnlocked.has("trader_x3")) {
    newlyQualifying.push("trader_x3");
  }

  if (newlyQualifying.length > 0) {
    const { error } = await supabase
      .from("user_achievements")
      .insert(
        newlyQualifying.map((achievementId) => ({ user_id: user.id, achievement_id: achievementId }))
      );
    if (error) throw new Error(error.message);
    revalidatePath("/profile");
  }

  return newlyQualifying;
}
