import Link from "next/link";
import { TradeStatusBadge } from "@/components/admin/TradeStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminTradeSummary } from "@/lib/queries/admin";

export function AdminTradesTable({
  trades,
  emptyMessage = "No trades yet.",
}: {
  trades: AdminTradeSummary[];
  emptyMessage?: string;
}) {
  if (trades.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Initiator</TableHead>
          <TableHead>Counterparty</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Fairness</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((trade) => (
          <TableRow key={trade.id}>
            <TableCell>
              <Link href={`/admin/users/${trade.initiator_id}`} className="hover:underline">
                {trade.initiator?.display_name ?? trade.initiator?.username ?? "—"}
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/admin/users/${trade.counterparty_id}`} className="hover:underline">
                {trade.counterparty?.display_name ?? trade.counterparty?.username ?? "—"}
              </Link>
            </TableCell>
            <TableCell>
              <TradeStatusBadge status={trade.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {trade.fairness_score != null ? `${trade.fairness_score.toFixed(0)}` : "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(trade.created_at).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
