"use client";

import { useAdminRecentTrades } from "@/lib/queries/admin";
import { AdminTradesTable } from "@/components/admin/AdminTradesTable";

export function AdminRecentTradesTable() {
  const { data: trades, isLoading } = useAdminRecentTrades();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading trades…</p>;

  return <AdminTradesTable trades={trades ?? []} emptyMessage="No trades yet." />;
}
