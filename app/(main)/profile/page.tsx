import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/nav/LogoutButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProfileDashboard } from "@/components/profile/ProfileDashboard";
import { getInitials } from "@/lib/utils";

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

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-4 sm:p-6">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 animation-duration-500 flex items-center gap-4">
        <Avatar className="size-20">
          <AvatarFallback className="bg-gradient-to-br from-primary to-brand font-heading text-2xl text-primary-foreground">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-3xl leading-tight tracking-tight">{name}</h1>
          {profile?.username && (
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          )}
        </div>
      </div>

      <ProfileDashboard />

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
