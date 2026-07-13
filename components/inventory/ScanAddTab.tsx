"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Camera, Check, ImageUp, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { cn } from "@/lib/utils";
import {
  RARITY_BORDER_CLASS,
  RARITY_GLOW_CLASS,
  RARITY_LABEL,
  RARITY_STYLE,
} from "@/lib/cards/rarity";
import { getAutoCroppedImageFile, warmUpAutoCrop } from "@/lib/cards/perspectiveCrop";
import { MAX_IMAGE_BYTES } from "@/lib/validation/image.schema";
import { useAddToInventory } from "@/lib/queries/inventory";
import { useScanCardPhoto } from "@/lib/queries/photoMatch";
import type { PhotoMatchCandidate, PhotoScanStatus } from "@/app/(main)/inventory/photo-match-actions";

const STATUS_MESSAGE: Record<Exclude<PhotoScanStatus, "matched">, string> = {
  no_text: "Couldn't read any text on that photo.",
  no_matches: "No catalog matches for that text.",
  unsupported_type: "That photo format isn't supported.",
  extraction_failed: "Something went wrong reading that photo.",
  // Deliberately doesn't say "try again": the quota won't come back within the
  // minute, and every retry spends a request we don't have. Point at the exit
  // that actually works — the search picker, one tap away below.
  rate_limited: "Card scanning has hit its daily AI limit. Add the card by searching instead.",
};

const SIGNAL_LABEL: Record<string, string> = {
  team: "Team match",
  setName: "Set match",
  visual: "Best visual match",
};

type Step = "pick" | "preparing" | "review" | "loading" | "results";

function croppedFileName(sourceFile: File) {
  return `${sourceFile.name.replace(/\.[^./\\]+$/, "")}-cropped.jpg`;
}

export function ScanAddTab({ onSwitchToSearch }: { onSwitchToSearch: () => void }) {
  const [step, setStep] = useState<Step>("pick");

  // The final, auto-cropped photo — what gets scanned and, on confirm,
  // uploaded as the inventory row's custom_image_url.
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const scanMutation = useScanCardPhoto();
  const addMutation = useAddToInventory();

  // The auto-crop's OpenCV chunk is the single biggest asset in the app, and
  // nothing can be cropped until it's down. This component only mounts once the
  // user opens the Scan tab (Base UI unmounts inactive tab panels), which is the
  // earliest moment we know they intend to scan — so start the fetch here and let
  // it run in the background while they take the photo, rather than starting it
  // in handleFileSelect and making them watch it.
  useEffect(() => {
    warmUpAutoCrop();
  }, []);

  function resetAll() {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setStep("pick");
    setQuantity(1);
    setSelectedCardId(null);
    scanMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  // No manual crop UI — the photo is auto-cropped the instant it's picked:
  // detect the card's four corners (however skewed by camera angle) and
  // perspective-warp them flat, falling back to a plain center crop if no
  // confident corners are found (see lib/cards/perspectiveCrop.ts). The user
  // just sees the ready-to-scan result.
  async function handleFileSelect(selected: File | null) {
    if (!selected) return;
    if (selected.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 8MB or smaller.");
      return;
    }
    setStep("preparing");
    try {
      const cropped = await getAutoCroppedImageFile(selected, croppedFileName(selected));
      setFile(cropped);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(cropped);
      });
      setStep("review");
    } catch {
      toast.error("Could not process that photo — try again.");
      setStep("pick");
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
          resetAll();
        },
        onError: (error) => toast.error(error.message),
      }
    );
  }

  const result = scanMutation.data;

  return (
    <div className="flex flex-col gap-4">
      {(step === "pick" || step === "preparing") && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={step === "preparing"}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUp className="size-4" />
              Upload photo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={step === "preparing"}
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="size-4" />
              Take photo
            </Button>
          </div>
          {step === "preparing" && (
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Preparing your photo…
            </p>
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
            <div className="flex justify-center gap-2">
              <Button type="button" onClick={handleScan}>
                Scan card
              </Button>
              <Button type="button" variant="outline" onClick={resetAll}>
                Retake
              </Button>
            </div>
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
            {/* No "Try again" against a spent quota — rescanning the same photo
                is guaranteed to fail again, so offering it would just walk the
                user back into the same wall. Search is the only way forward. */}
            {result.status !== "rate_limited" && (
              <Button type="button" variant="outline" size="sm" onClick={() => setStep("review")}>
                Try again
              </Button>
            )}
            <Button
              type="button"
              variant={result.status === "rate_limited" ? "default" : "ghost"}
              size="sm"
              onClick={onSwitchToSearch}
            >
              <Search className="size-4" />
              Search manually
            </Button>
          </div>
        </div>
      )}

      {(step === "pick" || step === "review") && (
        <Button type="button" variant="ghost" size="sm" onClick={onSwitchToSearch}>
          <Search className="size-4" />
          Search manually instead
        </Button>
      )}
    </div>
  );
}
