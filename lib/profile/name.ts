// Profiles store one free-text `display_name` ("Bhuwan Lodha"), not structured
// given/family parts, so a "first name" is a presentation-time convenience
// rather than a fact we hold: it's the leading whitespace-delimited token.
//
// Usernames are handles, not names — there is no first name to take from
// "bhuwan18" — so when there's no display_name the username is passed through
// whole rather than split.
//
// This is deliberately naive about how names work (plenty of people's first
// name isn't their leading token, and plenty don't have two). That's tolerable
// for a friendly greeting and an "X wants to trade with you" headline, and it's
// why nothing else keys off this — it's a label, never an identity.

export interface NamedProfile {
  username: string;
  display_name: string | null;
}

export function firstNameOf(profile: NamedProfile | null | undefined): string | null {
  if (!profile) return null;

  const displayName = profile.display_name?.trim();
  if (!displayName) return profile.username || null;

  return displayName.split(/\s+/)[0];
}
