grant usage on schema public to authenticated, service_role;

grant select on table public.user_billing to authenticated;

grant select, insert, update, delete on table public.user_billing to service_role;

grant execute on function public.set_user_billing_updated_at() to service_role;
