import { AdminUserTable } from "@/components/admin/AdminUserTable";

export const metadata = {
  title: "Users — Admin — Bitts Attax",
};

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">Every registered collector.</p>
      </div>
      <AdminUserTable />
    </div>
  );
}
