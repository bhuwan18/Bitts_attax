"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const UuidSchema = z.uuid();
const QuantitySchema = z.number().int().min(1).max(999);

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in.");
  return { supabase, user };
}

export async function addToInventory(cardId: string, quantity = 1) {
  const parsedCardId = UuidSchema.parse(cardId);
  const parsedQuantity = QuantitySchema.parse(quantity);
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("inventory_items")
    .upsert(
      { user_id: user.id, card_id: parsedCardId, quantity: parsedQuantity },
      { onConflict: "user_id,card_id", ignoreDuplicates: false }
    );

  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
}

export async function updateInventoryQuantity(itemId: string, quantity: number) {
  const parsedItemId = UuidSchema.parse(itemId);
  const parsedQuantity = QuantitySchema.parse(quantity);
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("inventory_items")
    .update({ quantity: parsedQuantity })
    .eq("id", parsedItemId);

  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
}

export async function removeInventoryItem(itemId: string) {
  const parsedItemId = UuidSchema.parse(itemId);
  const { supabase } = await requireUser();

  const { error } = await supabase.from("inventory_items").delete().eq("id", parsedItemId);
  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
}

export async function addWantItem(cardId: string) {
  const parsedCardId = UuidSchema.parse(cardId);
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("want_items")
    .upsert({ user_id: user.id, card_id: parsedCardId }, { onConflict: "user_id,card_id" });

  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
}

export async function removeWantItem(itemId: string) {
  const parsedItemId = UuidSchema.parse(itemId);
  const { supabase } = await requireUser();

  const { error } = await supabase.from("want_items").delete().eq("id", parsedItemId);
  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
}
