"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/types/database.types";
import { evaluateAchievements } from "@/app/(main)/gamification/actions";

const UuidSchema = z.uuid();
const QuantitySchema = z.number().int().min(1).max(999);

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

const ImageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0 && file.size <= MAX_IMAGE_BYTES, "Image must be 8MB or smaller.")
  .refine((file) => file.type in EXTENSION_BY_MIME, "Unsupported image type.");

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in.");
  return { supabase, user };
}

// `image` is the physical card photo a user optionally attaches instead of the catalog's stock
// `cards.image_url` — uploaded to the `card-images` storage bucket under the caller's own folder
// (enforced by storage RLS, see 0008_inventory_custom_images.sql) and tagged onto the row via
// `custom_image_url`. Omitted (undefined) means "leave whatever's already stored" rather than
// clearing it, since re-adding an already-owned card without picking a new photo shouldn't wipe
// a previously uploaded one.
export async function addToInventory(cardId: string, quantity = 1, image?: File | null) {
  const parsedCardId = UuidSchema.parse(cardId);
  const parsedQuantity = QuantitySchema.parse(quantity);
  const { supabase, user } = await requireUser();

  const payload: TablesInsert<"inventory_items"> = {
    user_id: user.id,
    card_id: parsedCardId,
    quantity: parsedQuantity,
  };

  if (image) {
    const parsedImage = ImageFileSchema.parse(image);
    const extension = EXTENSION_BY_MIME[parsedImage.type];
    const path = `${user.id}/${parsedCardId}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("card-images")
      .upload(path, parsedImage, { contentType: parsedImage.type });
    if (uploadError) throw new Error(uploadError.message);

    payload.custom_image_url = supabase.storage.from("card-images").getPublicUrl(path).data
      .publicUrl;
  }

  const { error } = await supabase
    .from("inventory_items")
    .upsert(payload, { onConflict: "user_id,card_id", ignoreDuplicates: false });

  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
  revalidatePath(`/cards/${parsedCardId}`);
  await evaluateAchievements();
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
