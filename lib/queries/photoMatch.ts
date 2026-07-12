"use client";

import { useMutation } from "@tanstack/react-query";
import { scanCardPhoto, type PhotoScanResult } from "@/app/(main)/inventory/photo-match-actions";

// Separate file from lib/queries/inventory.ts, mirroring lib/queries/matches.ts
// sitting alongside but apart from trades.ts — this is a distinct read/classify
// concern, not an inventory write, so there's no cache to invalidate here.
export function useScanCardPhoto() {
  return useMutation({
    mutationFn: (image: File): Promise<PhotoScanResult> => scanCardPhoto(image),
  });
}
