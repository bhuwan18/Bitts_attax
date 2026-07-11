import { createClient } from "@/lib/supabase/server";
import { StatStrip } from "@/components/shared/StatStrip";
import { AdminRecentTradesTable } from "@/components/admin/AdminRecentTradesTable";

export const metadata = {
  title: "Admin — Bitts Attax",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: userCount }, { count: tradeCount }, { count: openListingCount }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("trades").select("*", { count: "exact", head: true }),
      supabase
        .from("trade_listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "open"),
    ]);

  const stats = [
    { label: "Users", value: userCount ?? 0 },
    { label: "Trades", value: tradeCount ?? 0 },
    { label: "Open listings", value: openListingCount ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">User list and cross-user activity.</p>
      </div>

      <StatStrip items={stats} size="lg" />

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-bold tracking-tight">Recent trades</h2>
        <AdminRecentTradesTable />
      </div>
    </div>
  );
}
