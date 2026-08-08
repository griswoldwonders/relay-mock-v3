create index if not exists cohort_members_org_idx on public.cohort_members(organization_id);
create index if not exists cohort_members_user_idx on public.cohort_members(user_id);
create index if not exists data_sources_created_by_idx on public.data_sources(created_by);
create index if not exists organization_member_sites_org_idx on public.organization_member_sites(organization_id);
create index if not exists organization_member_sites_user_idx on public.organization_member_sites(user_id);
create index if not exists organization_sites_created_by_idx on public.organization_sites(created_by);
create index if not exists program_cohorts_cohort_idx on public.program_cohorts(cohort_id);
create index if not exists program_cohorts_org_idx on public.program_cohorts(organization_id);
create index if not exists program_sites_org_idx on public.program_sites(organization_id);
create index if not exists program_sites_site_idx on public.program_sites(site_id);
create index if not exists tdm_programs_created_by_idx on public.tdm_programs(created_by);

drop policy if exists organization_member_sites_select on public.organization_member_sites;
drop policy if exists organization_member_sites_manage on public.organization_member_sites;
create policy organization_member_sites_select on public.organization_member_sites for select to authenticated using (user_id = (select auth.uid()) or private.can_manage_org(organization_id));
create policy organization_member_sites_insert on public.organization_member_sites for insert to authenticated with check (private.can_manage_org(organization_id));
create policy organization_member_sites_update on public.organization_member_sites for update to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy organization_member_sites_delete on public.organization_member_sites for delete to authenticated using (private.can_manage_org(organization_id));

drop policy if exists cohort_members_select on public.cohort_members;
drop policy if exists cohort_members_manage on public.cohort_members;
create policy cohort_members_select on public.cohort_members for select to authenticated using (user_id = (select auth.uid()) or private.can_analyze_org(organization_id));
create policy cohort_members_insert on public.cohort_members for insert to authenticated with check (private.can_manage_org(organization_id));
create policy cohort_members_update on public.cohort_members for update to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy cohort_members_delete on public.cohort_members for delete to authenticated using (private.can_manage_org(organization_id));

drop policy if exists program_sites_select on public.program_sites;
drop policy if exists program_sites_manage on public.program_sites;
create policy program_sites_select on public.program_sites for select to authenticated using (private.is_org_member(organization_id));
create policy program_sites_insert on public.program_sites for insert to authenticated with check (private.can_manage_org(organization_id));
create policy program_sites_update on public.program_sites for update to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy program_sites_delete on public.program_sites for delete to authenticated using (private.can_manage_org(organization_id));

drop policy if exists program_cohorts_select on public.program_cohorts;
drop policy if exists program_cohorts_manage on public.program_cohorts;
create policy program_cohorts_select on public.program_cohorts for select to authenticated using (private.is_org_member(organization_id));
create policy program_cohorts_insert on public.program_cohorts for insert to authenticated with check (private.can_manage_org(organization_id));
create policy program_cohorts_update on public.program_cohorts for update to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy program_cohorts_delete on public.program_cohorts for delete to authenticated using (private.can_manage_org(organization_id));

drop policy if exists data_sources_select on public.data_sources;
drop policy if exists data_sources_manage on public.data_sources;
create policy data_sources_select on public.data_sources for select to authenticated using (private.can_analyze_org(organization_id));
create policy data_sources_insert on public.data_sources for insert to authenticated with check (private.can_manage_org(organization_id));
create policy data_sources_update on public.data_sources for update to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy data_sources_delete on public.data_sources for delete to authenticated using (private.can_manage_org(organization_id));

drop policy if exists organization_onboarding_select on public.organization_onboarding;
drop policy if exists organization_onboarding_manage on public.organization_onboarding;
create policy organization_onboarding_select on public.organization_onboarding for select to authenticated using (private.is_org_member(organization_id));
create policy organization_onboarding_insert on public.organization_onboarding for insert to authenticated with check (private.can_manage_org(organization_id));
create policy organization_onboarding_update on public.organization_onboarding for update to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy organization_onboarding_delete on public.organization_onboarding for delete to authenticated using (private.can_manage_org(organization_id));

drop policy if exists commuter_needs_owner_or_admin_select on public.commuter_needs;
create policy commuter_needs_owner_or_admin_select on public.commuter_needs for select to authenticated using ((user_id = (select auth.uid())) or ((organization_id is not null) and private.can_analyze_org(organization_id)));

drop policy if exists planned_routes_owner_or_admin_select on public.planned_routes;
create policy planned_routes_owner_or_admin_select on public.planned_routes for select to authenticated using ((user_id = (select auth.uid())) or ((organization_id is not null) and private.can_analyze_org(organization_id)));
