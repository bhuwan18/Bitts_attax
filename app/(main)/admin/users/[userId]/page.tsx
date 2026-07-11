import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { AdminUserActivityPanel } from "@/components/admin/AdminUserActivityPanel";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/users"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to users
      </Link>

      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">
            {profile.display_name ?? profile.username}
          </h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
        <Badge variant={profile.role === "admin" ? "default" : "outline"}>{profile.role}</Badge>
      </div>

      <AdminUserActivityPanel userId={profile.id} />
    </div>
  );
}
