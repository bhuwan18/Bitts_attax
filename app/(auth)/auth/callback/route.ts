import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles every OAuth / magic-link / signup redirect: exchanges the one-time
// `code` for a session, then sends the user into the app.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  // Only allow same-origin relative paths through, so a crafted callback URL
  // can't turn this endpoint into an open redirect.
  const requested = searchParams.get("redirectTo") ?? "/cards";
  const redirectTo =
    requested.startsWith("/") && !requested.startsWith("//") ? requested : "/cards";

  // Providers can bounce back with an error (e.g. the user cancelled consent).
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
  if (oauthError) {
    return NextResponse.redirect(loginWithError(origin, oauthError));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(loginWithError(origin, error.message));
    }
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}

function loginWithError(origin: string, message: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", message);
  return url;
}
