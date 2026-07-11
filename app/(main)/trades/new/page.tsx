import { TradeListingForm } from "@/components/trades/TradeListingForm";

export const metadata = {
  title: "New Listing — Bitts Attax",
};

export default function NewTradeListingPage() {
  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-xl font-semibold">Create a Trade Listing</h1>
      <TradeListingForm />
    </div>
  );
}
