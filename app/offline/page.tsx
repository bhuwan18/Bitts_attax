import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Offline — Bitts Attax",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <WifiOff className="size-7 text-muted-foreground" />
      </div>
      <h1 className="font-heading text-2xl font-extrabold tracking-tight">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        No connection right now. Previously viewed cards you browsed are still available, but
        inventory, trading, and chat need a live connection.
      </p>
    </div>
  );
}
