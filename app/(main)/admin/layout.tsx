import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/admin";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") redirect("/");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 p-4 sm:p-6">
      <AdminNav />
      {children}
    </div>
  );
}
