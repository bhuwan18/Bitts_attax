import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HomeDashboard } from "@/components/home/HomeDashboard";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", user.id)
    .single();

  const name = profile?.display_name ?? profile?.username ?? "Collector";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="px-4 pt-5 sm:px-6">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="font-heading text-2xl font-bold">{name}</h1>
      </div>
      <HomeDashboard />
    </div>
  );
}
