create or replace function private.is_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$ select private.can_manage_org(org_id); $$;

drop policy if exists reviews_admin_delete on public.administrative_reviews;
drop policy if exists reviews_admin_insert on public.administrative_reviews;
drop policy if exists reviews_admin_update on public.administrative_reviews;
create policy reviews_admin_delete on public.administrative_reviews for delete to authenticated using ((organization_id is not null) and private.can_review_org(organization_id));
create policy reviews_admin_insert on public.administrative_reviews for insert to authenticated with check ((organization_id is not null) and private.can_review_org(organization_id));
create policy reviews_admin_update on public.administrative_reviews for update to authenticated using ((organization_id is not null) and private.can_review_org(organization_id)) with check ((organization_id is not null) and private.can_review_org(organization_id));

drop policy if exists commuter_needs_owner_or_admin_select on public.commuter_needs;
create policy commuter_needs_owner_or_admin_select on public.commuter_needs for select to authenticated using ((user_id = auth.uid()) or ((organization_id is not null) and private.can_analyze_org(organization_id)));

drop policy if exists planned_routes_owner_or_admin_select on public.planned_routes;
create policy planned_routes_owner_or_admin_select on public.planned_routes for select to authenticated using ((user_id = auth.uid()) or ((organization_id is not null) and private.can_analyze_org(organization_id)));

create or replace function public.get_participant_directory(org_id uuid)
returns table(user_id uuid,membership_role text,membership_status text,participant_type text,commuter_need_count bigint,planned_route_count bigint,latest_signal_at timestamptz)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select m.user_id,m.role,m.status,coalesce(p.participant_type,'commuter'),
    (select count(*) from public.commuter_needs n where n.organization_id=org_id and n.user_id=m.user_id),
    (select count(*) from public.planned_routes r where r.organization_id=org_id and r.user_id=m.user_id),
    greatest((select max(n.created_at) from public.commuter_needs n where n.organization_id=org_id and n.user_id=m.user_id),(select max(r.created_at) from public.planned_routes r where r.organization_id=org_id and r.user_id=m.user_id))
  from public.organization_members m left join public.profiles p on p.id=m.user_id
  where m.organization_id=org_id and m.role='participant' and private.can_analyze_org(org_id)
  order by latest_signal_at desc nulls last,m.created_at desc;
$$;
revoke all on function public.get_participant_directory(uuid) from public,anon;
grant execute on function public.get_participant_directory(uuid) to authenticated;
