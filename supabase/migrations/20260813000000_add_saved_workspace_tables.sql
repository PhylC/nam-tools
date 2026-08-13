create table if not exists public.roi_plans (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists roi_plans_user_updated_at_idx
  on public.roi_plans (user_id, updated_at desc);

create table if not exists public.deck_briefs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  template_type text not null default 'Customer deck',
  data jsonb not null default '{}'::jsonb,
  generated_outline jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deck_briefs_user_updated_at_idx
  on public.deck_briefs (user_id, updated_at desc);

create or replace function public.set_saved_workspace_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_roi_plans_updated_at on public.roi_plans;

create trigger set_roi_plans_updated_at
before update on public.roi_plans
for each row
execute function public.set_saved_workspace_updated_at();

drop trigger if exists set_deck_briefs_updated_at on public.deck_briefs;

create trigger set_deck_briefs_updated_at
before update on public.deck_briefs
for each row
execute function public.set_saved_workspace_updated_at();

alter table public.roi_plans enable row level security;
alter table public.deck_briefs enable row level security;

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on table public.roi_plans to authenticated;
grant select, insert, update, delete on table public.deck_briefs to authenticated;
grant select, insert, update, delete on table public.roi_plans to service_role;
grant select, insert, update, delete on table public.deck_briefs to service_role;

grant execute on function public.set_saved_workspace_updated_at() to authenticated, service_role;

drop policy if exists "Users can read own ROI plans" on public.roi_plans;
drop policy if exists "Users can insert own ROI plans" on public.roi_plans;
drop policy if exists "Users can update own ROI plans" on public.roi_plans;
drop policy if exists "Users can delete own ROI plans" on public.roi_plans;

create policy "Users can read own ROI plans"
on public.roi_plans
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own ROI plans"
on public.roi_plans
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own ROI plans"
on public.roi_plans
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own ROI plans"
on public.roi_plans
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own deck briefs" on public.deck_briefs;
drop policy if exists "Users can insert own deck briefs" on public.deck_briefs;
drop policy if exists "Users can update own deck briefs" on public.deck_briefs;
drop policy if exists "Users can delete own deck briefs" on public.deck_briefs;

create policy "Users can read own deck briefs"
on public.deck_briefs
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own deck briefs"
on public.deck_briefs
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own deck briefs"
on public.deck_briefs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own deck briefs"
on public.deck_briefs
for delete
to authenticated
using (auth.uid() = user_id);
