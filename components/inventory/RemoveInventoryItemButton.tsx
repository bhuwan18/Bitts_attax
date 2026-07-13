"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function RemoveInventoryItemButton({
  cardName,
  onConfirm,
  className,
}: {
  cardName: string;
  onConfirm: () => void;
  className?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Remove from inventory"
            className={className}
          />
        }
      >
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {cardName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the card from your Haves. You can add it back later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
