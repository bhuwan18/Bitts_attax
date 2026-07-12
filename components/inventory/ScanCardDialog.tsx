"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
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
import { RARITY_LABEL, RARITY_STYLE } from "@/lib/cards/rarity";
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

type Step = "capture" | "loading" | "results" | "manual";

export function ScanCardDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("capture");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const scanMutation = useScanCardPhoto();
  const addMutation = useAddToInventory();

  function resetPhoto() {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  function resetAll() {
    resetPhoto();
    setStep("capture");
    setQuantity(1);
    setSelectedCardId(null);
    scanMutation.reset();
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
    setFile(selected);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
  }

  function handleScan() {
    if (!file) return;
    setStep("loading");
    setSelectedCardId(null);
    scanMutation.mutate(file, {
      onSuccess: () => setStep("results"),
      onError: (error) => {
        toast.error(error.message);
        setStep("capture");
      },
    });
  }

  function tryAgain() {
    setStep("capture");
    setSelectedCardId(null);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan a card</DialogTitle>
          <DialogDescription>
            Photograph a physical card and we&apos;ll suggest the closest catalog matches to add.
          </DialogDescription>
        </DialogHeader>

        {(step === "capture" || step === "loading") && (
          <div className="flex flex-col gap-3">
            <div className="relative mx-auto aspect-[3/4] w-40 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
              {previewUrl ? (
                <Image src={previewUrl} alt="Your photo" fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No photo yet
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={step === "loading"}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageUp className="size-4" />
                Upload photo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={step === "loading"}
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="size-4" />
                Take photo
              </Button>
              {file && step === "capture" && (
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

            <Button type="button" onClick={handleScan} disabled={!file || step === "loading"}>
              {step === "loading" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Reading your card…
                </>
              ) : (
                "Scan card"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={step === "loading"}
              onClick={() => setStep("manual")}
            >
              <Search className="size-4" />
              Search manually instead
            </Button>
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
                <div className="flex max-h-72 flex-col divide-y divide-border overflow-y-auto rounded-xl bg-card ring-1 ring-border">
                  {result.candidates.map(({ card, matchedOn }: PhotoMatchCandidate) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedCardId(card.id)}
                      className={`flex items-center gap-2.5 p-2 text-left transition-colors ${
                        selectedCardId === card.id ? "bg-muted ring-2 ring-inset ring-ring" : ""
                      }`}
                    >
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {card.image_url && (
                          <Image src={card.image_url} alt={card.name} fill className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{card.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {card.team ?? "—"} · {RARITY_LABEL[card.rarity]}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className={RARITY_STYLE[card.rarity]}>
                          {RARITY_LABEL[card.rarity]}
                        </Badge>
                        {matchedOn
                          .filter((signal) => signal !== "name")
                          .map((signal) => (
                            <Badge key={signal} variant="secondary">
                              {SIGNAL_LABEL[signal]}
                            </Badge>
                          ))}
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
              <Button type="button" variant="outline" size="sm" onClick={tryAgain}>
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
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep("capture")}>
              Back to scanning
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
