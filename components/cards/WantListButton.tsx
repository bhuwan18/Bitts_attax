"use client";

import { useRouter } from "next/navigation";
import { Heart, HeartOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAddWantItem, useRemoveWantItem } from "@/lib/queries/inventory";

// The want_items server actions only revalidate /inventory, so refresh the
// current card route by hand to flip this button's state after a mutation.
export function WantListButton({
  cardId,
  cardName,
  wantItemId,
}: {
  cardId: string;
  cardName: string;
  wantItemId: string | null;
}) {
  const router = useRouter();
  const addMutation = useAddWantItem();
  const removeMutation = useRemoveWantItem();
  const isPending = addMutation.isPending || removeMutation.isPending;

  function handleClick() {
    if (wantItemId) {
      removeMutation.mutate(wantItemId, {
        onSuccess: () => {
          toast.success(`Removed ${cardName} from your want list.`);
          router.refresh();
        },
        onError: (error) => toast.error(error.message),
      });
      return;
    }

    addMutation.mutate(cardId, {
      onSuccess: () => {
        toast.success(`Added ${cardName} to your want list.`);
        router.refresh();
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <Button
      variant={wantItemId ? "outline" : "secondary"}
      className="w-full sm:w-auto"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : wantItemId ? (
        <HeartOff className="size-4" />
      ) : (
        <Heart className="size-4" />
      )}
      {wantItemId ? "Remove from Wants" : "Add to Wants"}
    </Button>
  );
}
