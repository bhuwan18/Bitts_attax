import { CardSearch } from "@/components/cards/CardSearch";

export const metadata = {
  title: "Card Database — Bitts Attax",
};

export default function CardsPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Card Database</h1>
        <p className="text-sm text-muted-foreground">Browse every card in the set.</p>
      </div>
      <CardSearch />
    </div>
  );
}
