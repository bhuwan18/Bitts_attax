"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Camera, Check, ImageUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAddToInventory } from "@/lib/queries/inventory";
import type { Card } from "@/lib/types/database.types";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export interface ExistingInventoryItem {
  id: string;
  quantity: number;
  custom_image_url: string | null;
}

export function AddToInventoryDialog({
  card,
  existingItem,
}: {
  card: Card;
  existingItem: ExistingInventoryItem | null;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const addMutation = useAddToInventory();

  const usingCustomImage = Boolean(file || existingItem?.custom_image_url);
  const displayImageUrl = previewUrl ?? existingItem?.custom_image_url ?? card.image_url;

  function resetPhoto() {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  function handleFileSelect(selected: File | null) {
    if (!selected) return;
    if (selected.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 8MB or smaller.");
      return;
    }
    setFile(selected);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetPhoto();
  }

  function handleConfirm() {
    addMutation.mutate(
      { cardId: card.id, quantity: existingItem?.quantity ?? 1, image: file },
      {
        onSuccess: () => {
          toast.success(
            file ? `Added ${card.name} with your photo.` : `Added ${card.name} to your inventory.`
          );
          setOpen(false);
          resetPhoto();
        },
        onError: (error) => toast.error(error.message),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant={existingItem ? "outline" : "default"} className="w-full sm:w-auto" />
        }
      >
        {existingItem ? "Edit in Inventory" : "Add to Inventory"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {card.name} to your inventory?</DialogTitle>
          <DialogDescription>
            This adds the card to your Haves. Use the stock image below, or attach a photo of
            your own physical card instead.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="relative mx-auto aspect-[3/4] w-40 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
            {displayImageUrl ? (
              <Image src={displayImageUrl} alt={card.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No image
              </div>
            )}
            {usingCustomImage && (
              <Badge variant="secondary" className="absolute bottom-1 left-1">
                Your photo
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUp className="size-4" />
              Upload photo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="size-4" />
              Take photo
            </Button>
            {file && (
              <Button type="button" variant="ghost" size="sm" onClick={resetPhoto}>
                Undo
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleConfirm} disabled={addMutation.isPending}>
            {addMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
