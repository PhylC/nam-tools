create table if not exists public.saved_analyses (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  calculator_id text not null default 'calculator',
  calculator_name text not null default 'Calculator',
  source_path text not null default '/calculators',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_analyses_user_updated_at_idx
  on public.saved_analyses (user_id, updated_at desc);

create table if not exists public.saved_scenarios (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  tool_id text not null default 'roi-tool',
  tool_name text not null default 'ROI planner',
  source_path text not null default '/roi-tool',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_scenarios_user_updated_at_idx
  on public.saved_scenarios (user_id, updated_at desc);

drop trigger if exists set_saved_analyses_updated_at on public.saved_analyses;

create trigger set_saved_analyses_updated_at
before update on public.saved_analyses
for each row
execute function public.set_saved_workspace_updated_at();

drop trigger if exists set_saved_scenarios_updated_at on public.saved_scenarios;

create trigger set_saved_scenarios_updated_at
before update on public.saved_scenarios
for each row
execute function public.set_saved_workspace_updated_at();

alter table public.saved_analyses enable row level security;
alter table public.saved_scenarios enable row level security;

grant select, insert, update, delete on table public.saved_analyses to authenticated;
grant select, insert, update, delete on table public.saved_scenarios to authenticated;
grant select, insert, update, delete on table public.saved_analyses to service_role;
grant select, insert, update, delete on table public.saved_scenarios to service_role;

drop policy if exists "Users can read own saved analyses" on public.saved_analyses;
drop policy if exists "Users can insert own saved analyses" on public.saved_analyses;
drop policy if exists "Users can update own saved analyses" on public.saved_analyses;
drop policy if exists "Users can delete own saved analyses" on public.saved_analyses;

create policy "Users can read own saved analyses"
on public.saved_analyses
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own saved analyses"
on public.saved_analyses
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own saved analyses"
on public.saved_analyses
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own saved analyses"
on public.saved_analyses
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own saved scenarios" on public.saved_scenarios;
drop policy if exists "Users can insert own saved scenarios" on public.saved_scenarios;
drop policy if exists "Users can update own saved scenarios" on public.saved_scenarios;
drop policy if exists "Users can delete own saved scenarios" on public.saved_scenarios;

create policy "Users can read own saved scenarios"
on public.saved_scenarios
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own saved scenarios"
on public.saved_scenarios
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own saved scenarios"
on public.saved_scenarios
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own saved scenarios"
on public.saved_scenarios
for delete
to authenticated
using ((select auth.uid()) = user_id);
