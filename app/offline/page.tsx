import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Offline — Bitts Attax",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <WifiOff className="size-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        No connection right now. Previously viewed cards you browsed are still available, but
        inventory, trading, and chat need a live connection.
      </p>
    </div>
  );
}
