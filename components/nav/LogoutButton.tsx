"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/components/providers/SupabaseProvider";

export function LogoutButton() {
  const supabase = useSupabase();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="mt-2 w-fit"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      Log out
    </Button>
  );
}
