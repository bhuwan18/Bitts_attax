import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AddCardWorkflow } from "@/components/inventory/AddCardWorkflow";

export const metadata = {
  title: "Add a Card — Bitts Attax",
};

export default function AddCardPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/inventory"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Inventory
        </Link>
        <h1 className="font-heading text-3xl tracking-tight">Add a Card</h1>
        <p className="text-sm text-muted-foreground">
          Search the catalog by name, or scan a photo of your physical card.
        </p>
      </div>
      <AddCardWorkflow />
    </div>
  );
}
