import { CardSearch } from "@/components/cards/CardSearch";

export const metadata = {
  title: "Card Database — Bitts Attax",
};

export default function CardsPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Card Database</h1>
      <CardSearch />
    </div>
  );
}
