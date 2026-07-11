"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/components/providers/SupabaseProvider";

export function LogoutButton() {
  const supabase = useSupabase();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      <LogOut className="size-4" />
      Log out
    </Button>
  );
}
