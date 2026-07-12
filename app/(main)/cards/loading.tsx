import { CardGridSkeleton } from "@/components/cards/CardGrid";

export default function CardsLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">Card Database</h1>
        <p className="text-sm text-muted-foreground">Browse every card in the set.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="h-10 flex-1 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-[160px] animate-pulse rounded-lg bg-muted" />
      </div>
      <CardGridSkeleton />
    </div>
  );
}
