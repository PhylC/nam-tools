create table if not exists public.account_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  calculator_defaults jsonb not null default '{}'::jsonb,
  export_defaults jsonb not null default '{}'::jsonb,
  presentation_templates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_account_settings_updated_at on public.account_settings;

create trigger set_account_settings_updated_at
before update on public.account_settings
for each row
execute function public.set_saved_workspace_updated_at();

alter table public.account_settings enable row level security;

grant select, insert, update, delete on table public.account_settings to authenticated;
grant select, insert, update, delete on table public.account_settings to service_role;

drop policy if exists "Users can read own account settings" on public.account_settings;
drop policy if exists "Users can insert own account settings" on public.account_settings;
drop policy if exists "Users can update own account settings" on public.account_settings;
drop policy if exists "Users can delete own account settings" on public.account_settings;

create policy "Users can read own account settings"
on public.account_settings
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own account settings"
on public.account_settings
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own account settings"
on public.account_settings
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own account settings"
on public.account_settings
for delete
to authenticated
using ((select auth.uid()) = user_id);
