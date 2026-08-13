alter function public.set_user_billing_updated_at()
set search_path = '';

drop policy if exists "Users can read own billing state" on public.user_billing;

create policy "Users can read own billing state"
on public.user_billing
for select
to authenticated
using ((select auth.uid()) = user_id);

do $$
begin
  if to_regclass('public.deck_uploads') is not null then
    create index if not exists deck_uploads_user_id_idx
      on public.deck_uploads (user_id);

    create index if not exists deck_uploads_brief_id_idx
      on public.deck_uploads (brief_id);

    drop policy if exists "Users manage own deck uploads" on public.deck_uploads;

    create policy "Users manage own deck uploads"
    on public.deck_uploads
    for all
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
  end if;
end;
$$;
