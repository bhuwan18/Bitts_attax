"use client";

import { useAdminUserActivity } from "@/lib/queries/admin";
import { AdminTradesTable } from "@/components/admin/AdminTradesTable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AdminUserActivityPanel({ userId }: { userId: string }) {
  const { data, isLoading } = useAdminUserActivity(userId);

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading activity…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Section title="Trades">
        <AdminTradesTable trades={data.trades} emptyMessage="No trades yet." />
      </Section>

      <Section title="Inventory (Haves)">
        {data.inventory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No inventory items.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Condition</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.card.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.condition ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Section title="Want list">
        {data.wants.length === 0 ? (
          <p className="text-sm text-muted-foreground">No want-list items.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card</TableHead>
                <TableHead>Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.wants.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.card.name}</TableCell>
                  <TableCell>{item.priority}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-heading text-lg font-bold tracking-tight">{title}</h2>
      {children}
    </div>
  );
}
