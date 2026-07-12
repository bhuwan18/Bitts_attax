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

type TradeParty = AdminTradeSummary["initiator"];

// Never link out using the raw profile id — the admin section only ever
// surfaces usernames, including in URLs.
function UserLink({ profile }: { profile: TradeParty }) {
  if (!profile) return <span className="text-muted-foreground">—</span>;

  return (
    <Link
      href={`/admin/users/${encodeURIComponent(profile.username)}`}
      className="hover:underline"
    >
      {profile.display_name ?? profile.username}
    </Link>
  );
}

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
              <UserLink profile={trade.initiator} />
            </TableCell>
            <TableCell>
              <UserLink profile={trade.counterparty} />
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
