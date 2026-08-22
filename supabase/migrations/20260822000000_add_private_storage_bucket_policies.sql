insert into storage.buckets (id, name, public, file_size_limit)
values
  ('deck-template-uploads', 'deck-template-uploads', false, 20971520),
  ('roi-spreadsheet-uploads', 'roi-spreadsheet-uploads', false, 10485760),
  ('generated-decks', 'generated-decks', false, 26214400)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "Users can read own private uploads" on storage.objects;
drop policy if exists "Users can insert own private uploads" on storage.objects;
drop policy if exists "Users can update own private uploads" on storage.objects;
drop policy if exists "Users can delete own private uploads" on storage.objects;

create policy "Users can read own private uploads"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('deck-template-uploads', 'roi-spreadsheet-uploads', 'generated-decks')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can insert own private uploads"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('deck-template-uploads', 'roi-spreadsheet-uploads', 'generated-decks')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can update own private uploads"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('deck-template-uploads', 'roi-spreadsheet-uploads', 'generated-decks')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id in ('deck-template-uploads', 'roi-spreadsheet-uploads', 'generated-decks')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete own private uploads"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('deck-template-uploads', 'roi-spreadsheet-uploads', 'generated-decks')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
