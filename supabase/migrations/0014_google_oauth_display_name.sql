-- Google OAuth populates raw_user_meta_data with full_name/name/avatar_url
-- (not username/display_name), so handle_new_user() was always falling
-- through to the email-handle fallback for Google sign-ins. Prefer Google's
-- profile fields, and backfill profiles that already got stuck with the
-- email-handle fallback.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 8)),
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

-- Backfill: only touches profiles whose display_name still exactly matches
-- the trigger-generated email-handle fallback (there's no self-serve edit UI
-- yet, so that pattern uniquely identifies untouched auto-generated rows)
-- and whose auth.users row now has a usable Google name.
update public.profiles p
set display_name = coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
    avatar_url = coalesce(p.avatar_url, u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
where u.id = p.id
  and p.display_name = split_part(u.email, '@', 1)
  and coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name') is not null;
