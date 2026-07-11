"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";

export function useCurrentUser() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    });
    return () => subscription.subscription.unsubscribe();
  }, [supabase, queryClient]);

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });
}
