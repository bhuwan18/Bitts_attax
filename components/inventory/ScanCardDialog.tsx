"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Check, ImageUp, Loader2, ScanLine, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { CardPicker } from "@/components/inventory/CardPicker";
import { cn } from "@/lib/utils";
import {
  RARITY_BORDER_CLASS,
  RARITY_GLOW_CLASS,
  RARITY_LABEL,
  RARITY_STYLE,
} from "@/lib/cards/rarity";
import { getCroppedImageFile } from "@/lib/cards/cropImage";
import { MAX_IMAGE_BYTES } from "@/lib/validation/image.schema";
import { useAddToInventory } from "@/lib/queries/inventory";
import { useScanCardPhoto } from "@/lib/queries/photoMatch";
import type { PhotoMatchCandidate, PhotoScanStatus } from "@/app/(main)/inventory/photo-match-actions";

const STATUS_MESSAGE: Record<Exclude<PhotoScanStatus, "matched">, string> = {
  no_text: "Couldn't read any text on that photo.",
  no_matches: "No catalog matches for that text.",
  unsupported_type: "That photo format isn't supported.",
  extraction_failed: "Something went wrong reading that photo.",
};

const SIGNAL_LABEL: Record<string, string> = {
  team: "Team match",
  setName: "Set match",
};

// Every card image in this app displays at aspect-[3/4] (CardTile,
// InventoryItemTile, AddToInventoryDialog) — locking the crop to the same
// ratio means the stored photo is never re-cropped/stretched at display time.
const CROP_ASPECT = 3 / 4;

type Step = "pick" | "crop" | "review" | "loading" | "results" | "manual";

function croppedFileName(sourceFile: File) {
  return `${sourceFile.name.replace(/\.[^./\\]+$/, "")}-cropped.jpg`;
}

export function ScanCardDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pick");

  // The raw, uncropped photo — only used as the Cropper's source image.
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // The final cropped photo — what gets scanned and, on confirm, uploaded as
  // the inventory row's custom_image_url.
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const scanMutation = useScanCardPhoto();
  const addMutation = useAddToInventory();

  function resetAll() {
    setSourceFile(null);
    setSourcePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setStep("pick");
    setQuantity(1);
    setSelectedCardId(null);
    scanMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetAll();
  }

  function handleFileSelect(selected: File | null) {
    if (!selected) return;
    if (selected.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 8MB or smaller.");
      return;
    }
    setSourceFile(selected);
    setSourcePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setStep("crop");
  }

  async function handleConfirmCrop() {
    if (!sourceFile || !sourcePreviewUrl || !croppedAreaPixels) return;
    setIsCropping(true);
    try {
      const cropped = await getCroppedImageFile(
        sourcePreviewUrl,
        croppedAreaPixels,
        croppedFileName(sourceFile)
      );
      setFile(cropped);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(cropped);
      });
      setStep("review");
    } catch {
      toast.error("Could not crop that photo — try again.");
    } finally {
      setIsCropping(false);
    }
  }

  function handleScan() {
    if (!file) return;
    setStep("loading");
    setSelectedCardId(null);
    scanMutation.mutate(file, {
      onSuccess: () => setStep("results"),
      onError: (error) => {
        toast.error(error.message);
        setStep("review");
      },
    });
  }

  function confirmAdd(cardId: string) {
    addMutation.mutate(
      { cardId, quantity, image: file },
      {
        onSuccess: () => {
          toast.success("Added to your inventory.");
          setOpen(false);
          resetAll();
        },
        onError: (error) => toast.error(error.message),
      }
    );
  }

  const result = scanMutation.data;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <ScanLine className="size-4" />
        Scan a card
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scan a card</DialogTitle>
          <DialogDescription>
            Photograph a physical card and we&apos;ll suggest the closest catalog matches to add.
          </DialogDescription>
        </DialogHeader>

        {step === "pick" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
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
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep("manual")}>
              <Search className="size-4" />
              Search manually instead
            </Button>

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
        )}

        {step === "crop" && sourcePreviewUrl && (
          <div className="flex flex-col gap-3">
            <div className="relative h-72 w-full overflow-hidden rounded-lg bg-muted">
              <Cropper
                image={sourcePreviewUrl}
                crop={crop}
                zoom={zoom}
                aspect={CROP_ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)}
              />
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
            <div className="flex justify-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={resetAll}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleConfirmCrop} disabled={isCropping}>
                {isCropping ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Crop photo
              </Button>
            </div>
          </div>
        )}

        {(step === "review" || step === "loading") && previewUrl && (
          <div className="flex flex-col gap-3">
            <div className="relative mx-auto aspect-[3/4] w-40 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
              <Image src={previewUrl} alt="Your cropped photo" fill className="object-cover" />
            </div>

            {step === "loading" ? (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Reading your card…
              </p>
            ) : (
              <>
                <div className="flex justify-center gap-2">
                  <Button type="button" onClick={handleScan}>
                    Scan card
                  </Button>
                  <Button type="button" variant="outline" onClick={resetAll}>
                    Retake
                  </Button>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep("manual")}>
                  <Search className="size-4" />
                  Search manually instead
                </Button>
              </>
            )}
          </div>
        )}

        {step === "results" && result && (
          <div className="flex flex-col gap-3">
            {result.status === "matched" ? (
              <>
                {result.extraction && (
                  <p className="text-xs text-muted-foreground">
                    We read: <span className="font-medium">{result.extraction.name}</span>
                    {" · "}
                    {result.extraction.team ?? "—"} · {result.extraction.setName ?? "—"}
                  </p>
                )}
                <div className="grid max-h-96 grid-cols-2 gap-2 overflow-y-auto">
                  {result.candidates.map(({ card, matchedOn }: PhotoMatchCandidate) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedCardId(card.id)}
                      className={cn(
                        "flex flex-col gap-1.5 rounded-lg p-1.5 text-left transition-colors",
                        selectedCardId === card.id ? "bg-muted ring-2 ring-ring" : "hover:bg-muted/60"
                      )}
                    >
                      <div
                        className={cn(
                          "card-surface-gradient relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2",
                          RARITY_BORDER_CLASS[card.rarity] ?? RARITY_BORDER_CLASS.other,
                          RARITY_GLOW_CLASS[card.rarity] ?? RARITY_GLOW_CLASS.other
                        )}
                      >
                        {card.image_url ? (
                          <Image
                            src={card.image_url}
                            alt={card.name}
                            fill
                            sizes="(max-width: 640px) 45vw, 220px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                        {card.ovr_rating != null && (
                          <div className="absolute top-0 left-0 rounded-lg bg-foreground/90 px-1.5 py-1 font-heading text-xs leading-none text-background backdrop-blur-sm">
                            {card.ovr_rating}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="truncate text-xs font-semibold">{card.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{card.team ?? "—"}</p>
                        <div className="flex flex-wrap items-center gap-1">
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 font-sans text-[9px] font-extrabold tracking-wide uppercase",
                              RARITY_STYLE[card.rarity] ?? RARITY_STYLE.other
                            )}
                          >
                            {RARITY_LABEL[card.rarity] ?? card.rarity}
                          </span>
                          {matchedOn
                            .filter((signal) => signal !== "name")
                            .map((signal) => (
                              <Badge key={signal} variant="secondary" className="h-4 px-1 text-[9px]">
                                {SIGNAL_LABEL[signal]}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <QuantityStepper value={quantity} onChange={setQuantity} />
                  <Button
                    type="button"
                    onClick={() => selectedCardId && confirmAdd(selectedCardId)}
                    disabled={!selectedCardId || addMutation.isPending}
                  >
                    {addMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Confirm & Add
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/60 py-6 text-center">
                <p className="text-sm text-muted-foreground">{STATUS_MESSAGE[result.status]}</p>
                {result.extraction && result.status === "no_matches" && (
                  <p className="text-xs text-muted-foreground">
                    We read: {result.extraction.name || "—"} · {result.extraction.team ?? "—"}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setStep("review")}>
                Try again
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep("manual")}>
                <Search className="size-4" />
                Search manually
              </Button>
            </div>
          </div>
        )}

        {step === "manual" && (
          <div className="flex flex-col gap-3">
            <CardPicker addLabel="Add to Haves" isAdding={addMutation.isPending} onAdd={confirmAdd} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep(file ? "review" : "pick")}
            >
              Back to scanning
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
