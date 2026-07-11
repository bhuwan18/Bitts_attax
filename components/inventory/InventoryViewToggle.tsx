"use client";

import { LayoutGrid, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type InventoryView = "list" | "grid";

export function InventoryViewToggle({
  view,
  onChange,
}: {
  view: InventoryView;
  onChange: (view: InventoryView) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-input p-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="List view"
        aria-pressed={view === "list"}
        className={cn(
          "text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
        )}
        onClick={() => onChange("list")}
      >
        <LayoutList className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Grid view"
        aria-pressed={view === "grid"}
        className={cn(
          "text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
        )}
        onClick={() => onChange("grid")}
      >
        <LayoutGrid className="size-4" />
      </Button>
    </div>
  );
}
