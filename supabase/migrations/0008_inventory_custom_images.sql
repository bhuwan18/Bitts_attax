-- Lets a user attach their own photo of a physical card to their inventory
-- row instead of relying on the catalog's stock `cards.image_url`. Adds the
-- column plus a public storage bucket + owner-scoped write policies for the
-- uploaded files.

alter table public.inventory_items
  add column custom_image_url text;

-- Public read (card photos aren't sensitive; the app links directly to the
-- public URL), owner-only write. Path convention enforced by policy:
-- `{auth.uid()}/{card_id}-{timestamp}.{ext}`, so foldername()[1] == the
-- uploader's own id.
insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict (id) do nothing;

create policy "card images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'card-images');

create policy "users upload their own card images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users update their own card images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete their own card images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
