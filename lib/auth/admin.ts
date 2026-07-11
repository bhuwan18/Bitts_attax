import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database.types";

export type CurrentProfile = Pick<Profile, "id" | "username" | "display_name" | "role">;

// Re-derives identity from the session-scoped client rather than trusting any
// client-supplied id, same convention every Server Action in this app follows.
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, role")
    .eq("id", user.id)
    .single();

  return profile;
}
