create table if not exists public.user_billing (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_subscription_status text,
  stripe_price_id text,
  stripe_current_period_end timestamptz,
  stripe_cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_billing_stripe_customer_id_idx
  on public.user_billing (stripe_customer_id);

create index if not exists user_billing_stripe_subscription_id_idx
  on public.user_billing (stripe_subscription_id);

create or replace function public.set_user_billing_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_billing_updated_at on public.user_billing;

create trigger set_user_billing_updated_at
before update on public.user_billing
for each row
execute function public.set_user_billing_updated_at();

alter table public.user_billing enable row level security;

drop policy if exists "Users can read own billing state" on public.user_billing;

create policy "Users can read own billing state"
on public.user_billing
for select
to authenticated
using (auth.uid() = user_id);
