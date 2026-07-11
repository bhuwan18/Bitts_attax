"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { AuthShell } from "../AuthShell";

export default function MagicLinkPage() {
  const supabase = useSupabase();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell title="Sign in with a magic link" description="No password, no problem.">
      {sent ? (
        <div className="flex flex-col items-start gap-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
          <Send className="size-5 text-primary" />
          <p>
            Check <span className="font-medium text-foreground">{email}</span> for a sign-in link.
          </p>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-1">
            {loading ? "Sending…" : "Send magic link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
