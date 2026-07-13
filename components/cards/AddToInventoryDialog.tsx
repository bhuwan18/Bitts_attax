"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Check, Crop, ImageUp, Loader2 } from "lucide-react";
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
import { getCroppedImageFile } from "@/lib/cards/cropImage";
import { MAX_IMAGE_BYTES } from "@/lib/validation/image.schema";
import { useAddToInventory } from "@/lib/queries/inventory";
import type { Card } from "@/lib/types/database.types";

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

  // Manual crop editor — optional, off by default. The scan-to-add flow
  // (ScanCardDialog) auto-crops with no user step; this is the place a user
  // can fine-tune that (or any custom photo, including one already saved
  // from a previous visit) if the automatic result isn't quite right.
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);

  const usingCustomImage = Boolean(file || existingItem?.custom_image_url);
  const displayImageUrl = previewUrl ?? existingItem?.custom_image_url ?? card.image_url;
  // What "Adjust crop" edits: the freshly picked photo if there is one,
  // otherwise the already-saved custom photo — never the stock catalog image.
  const cropSourceUrl = previewUrl ?? existingItem?.custom_image_url ?? null;

  function resetPhoto() {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCropOpen(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
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

  function openCrop() {
    if (!cropSourceUrl) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropOpen(true);
  }

  async function applyCrop() {
    if (!cropSourceUrl || !croppedAreaPixels) return;
    setIsApplyingCrop(true);
    try {
      const cropped = await getCroppedImageFile(
        cropSourceUrl,
        croppedAreaPixels,
        "card-photo-cropped.jpg"
      );
      setFile(cropped);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(cropped);
      });
      setCropOpen(false);
    } catch {
      toast.error("Could not crop that photo — try again.");
    } finally {
      setIsApplyingCrop(false);
    }
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
      <DialogContent className={cropOpen ? "sm:max-w-lg" : undefined}>
        <DialogHeader>
          <DialogTitle>Add {card.name} to your inventory?</DialogTitle>
          <DialogDescription>
            This adds the card to your Haves. Use the stock image below, or attach a photo of
            your own physical card instead.
          </DialogDescription>
        </DialogHeader>

        {!cropOpen ? (
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

            {usingCustomImage && (
              <div className="flex justify-center">
                <Button type="button" variant="ghost" size="sm" onClick={openCrop}>
                  <Crop className="size-4" />
                  Adjust crop
                </Button>
              </div>
            )}

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
        ) : (
          <div className="flex flex-col gap-3">
            <div className="relative h-72 w-full overflow-hidden rounded-lg bg-muted">
              {cropSourceUrl && (
                <Cropper
                  image={cropSourceUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={3 / 4}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)}
                />
              )}
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Zoom"
            />
          </div>
        )}

        <DialogFooter>
          {cropOpen ? (
            <>
              <Button type="button" variant="outline" onClick={() => setCropOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={applyCrop}
                disabled={isApplyingCrop || !croppedAreaPixels}
              >
                {isApplyingCrop ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Apply crop
              </Button>
            </>
          ) : (
            <>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button onClick={handleConfirm} disabled={addMutation.isPending}>
                {addMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Confirm
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
