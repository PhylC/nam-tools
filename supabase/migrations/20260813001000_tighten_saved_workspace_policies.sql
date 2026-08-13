drop policy if exists "Users manage own ROI plans" on public.roi_plans;
drop policy if exists "Users manage own deck briefs" on public.deck_briefs;

drop policy if exists "Users can read own ROI plans" on public.roi_plans;
drop policy if exists "Users can insert own ROI plans" on public.roi_plans;
drop policy if exists "Users can update own ROI plans" on public.roi_plans;
drop policy if exists "Users can delete own ROI plans" on public.roi_plans;

create policy "Users can read own ROI plans"
on public.roi_plans
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own ROI plans"
on public.roi_plans
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own ROI plans"
on public.roi_plans
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own ROI plans"
on public.roi_plans
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own deck briefs" on public.deck_briefs;
drop policy if exists "Users can insert own deck briefs" on public.deck_briefs;
drop policy if exists "Users can update own deck briefs" on public.deck_briefs;
drop policy if exists "Users can delete own deck briefs" on public.deck_briefs;

create policy "Users can read own deck briefs"
on public.deck_briefs
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own deck briefs"
on public.deck_briefs
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own deck briefs"
on public.deck_briefs
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own deck briefs"
on public.deck_briefs
for delete
to authenticated
using ((select auth.uid()) = user_id);
