alter table public.user_billing
  add column if not exists stripe_cancel_at timestamptz,
  add column if not exists stripe_canceled_at timestamptz,
  add column if not exists stripe_cancellation_reason text;
