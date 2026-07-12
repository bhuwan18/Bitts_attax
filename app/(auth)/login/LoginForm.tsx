"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { GoogleSignInButton } from "../GoogleSignInButton";
import { AuthShell } from "../AuthShell";

export function LoginForm() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    router.push(searchParams.get("redirectTo") ?? "/");
    router.refresh();
  }

  // Surfaced when /auth/callback bounces a failed OAuth exchange back here.
  const oauthError = searchParams.get("error");

  return (
    <AuthShell
      title="Log in"
      description="Pick up your trades where you left off."
      footer={
        <div className="flex flex-col gap-1 text-center text-sm text-muted-foreground">
          <Link href="/magic-link" className="hover:text-foreground">
            Use a magic link instead
          </Link>
          <span>
            No account?{" "}
            <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
              Sign up
            </Link>
          </span>
        </div>
      }
    >
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {(error ?? oauthError) && (
          <p className="text-sm text-destructive">{error ?? oauthError}</p>
        )}
        <Button type="submit" disabled={loading} className="mt-1">
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <GoogleSignInButton />
    </AuthShell>
  );
}
