import { TradeListingForm } from "@/components/trades/TradeListingForm";

export const metadata = {
  title: "New Listing — Bitts Attax",
};

export default function NewTradeListingPage() {
  return (
    <div className="mx-auto max-w-lg p-4 sm:p-6">
      <h1 className="mb-1 font-heading text-3xl font-extrabold tracking-tight">
        Create a Trade Listing
      </h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Post what you have and what you&apos;re after — other collectors can propose a swap.
      </p>
      <TradeListingForm />
    </div>
  );
}
