"use client";

import Link from "next/link";
import { useAdminUsers } from "@/lib/queries/admin";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AdminUserTable() {
  const { data: users, isLoading } = useAdminUsers();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading users…</p>;

  if (!users || users.length === 0) {
    return <p className="text-sm text-muted-foreground">No users yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Username</TableHead>
          <TableHead>Display name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <Link href={`/admin/users/${user.id}`} className="font-medium hover:underline">
                @{user.username}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{user.display_name ?? "—"}</TableCell>
            <TableCell>
              <Badge variant={user.role === "admin" ? "default" : "outline"}>{user.role}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(user.created_at).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
