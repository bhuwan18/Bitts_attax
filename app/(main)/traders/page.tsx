import { TraderBrowseList } from "@/components/traders/TraderBrowseList";

export const metadata = {
  title: "Traders — Bitts Attax",
};

export default function TradersPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">Traders</h1>
        <p className="text-sm text-muted-foreground">
          Browse other collectors and see what they have.
        </p>
      </div>
      <TraderBrowseList />
    </div>
  );
}
