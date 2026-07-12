import { z } from "zod";

// Shared by app/(main)/inventory/actions.ts (attaching a photo to an inventory
// row) and app/(main)/inventory/photo-match-actions.ts (scanning a photo to
// find the card) — one size/type policy for every user-uploaded card photo.
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export const ImageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0 && file.size <= MAX_IMAGE_BYTES, "Image must be 8MB or smaller.")
  .refine((file) => file.type in EXTENSION_BY_MIME, "Unsupported image type.");
