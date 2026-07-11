import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/nav/LogoutButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const name = profile?.display_name ?? profile?.username ?? "Collector";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="bg-primary font-heading text-2xl font-extrabold text-primary-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">{name}</h1>
          {profile?.username && (
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border rounded-xl bg-card ring-1 ring-border">
        <ProfileRow label="Username" value={profile?.username ?? "—"} />
        <ProfileRow label="Email" value={user.email ?? "—"} />
      </div>

      <LogoutButton />
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
