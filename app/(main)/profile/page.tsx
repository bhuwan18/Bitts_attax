import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/nav/LogoutButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileDashboard } from "@/components/profile/ProfileDashboard";
import { AchievementBadgeGrid } from "@/components/profile/AchievementBadgeGrid";
import { AchievementEvaluator } from "@/components/profile/AchievementEvaluator";
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
    // Identity, level and stats read best full-width (a wide XP bar and three
    // big stat tiles). Badges and account details are short blocks, so on a
    // landscape tablet they sit side-by-side rather than stacking into a long
    // scroll with dead space either side.
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 animation-duration-500 flex items-center gap-4">
        <Avatar className="size-20">
          {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={name} />}
          <AvatarFallback className="bg-gradient-to-br from-primary to-brand font-heading text-2xl text-primary-foreground">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="font-heading truncate text-3xl leading-tight tracking-tight">{name}</h1>
          {profile?.username && (
            <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>
          )}
        </div>
      </div>

      <ProfileDashboard />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <AchievementBadgeGrid />

        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-lg">Account</h2>
          <div className="flex flex-col divide-y divide-border rounded-xl bg-card ring-1 ring-border">
            <ProfileRow label="Username" value={profile?.username ?? "—"} />
            <ProfileRow label="Email" value={user.email ?? "—"} />
          </div>
          <LogoutButton />
        </div>
      </div>

      <AchievementEvaluator />
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}
