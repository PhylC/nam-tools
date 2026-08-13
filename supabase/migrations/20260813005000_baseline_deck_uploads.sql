create table if not exists public.deck_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brief_id uuid references public.deck_briefs(id) on delete set null,
  file_path text not null,
  file_name text not null,
  file_type text,
  created_at timestamptz default now()
);

create index if not exists deck_uploads_user_id_idx
  on public.deck_uploads (user_id);

create index if not exists deck_uploads_brief_id_idx
  on public.deck_uploads (brief_id);

alter table public.deck_uploads enable row level security;

grant select, insert, update, delete on table public.deck_uploads to authenticated;
grant select, insert, update, delete on table public.deck_uploads to service_role;

drop policy if exists "Users manage own deck uploads" on public.deck_uploads;

create policy "Users manage own deck uploads"
on public.deck_uploads
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
