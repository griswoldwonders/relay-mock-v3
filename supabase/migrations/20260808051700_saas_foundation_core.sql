-- Relay Rider SaaS foundation: authenticated multi-tenant institutional objects.

create or replace function private.has_org_role(org_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

create or replace function private.can_manage_org(org_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_catalog as $$
  select private.has_org_role(org_id, array['owner','admin','program_admin','tdm_manager']);
$$;

create or replace function private.can_review_org(org_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_catalog as $$
  select private.has_org_role(org_id, array['owner','admin','program_admin','tdm_manager','reviewer']);
$$;

create or replace function private.can_analyze_org(org_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_catalog as $$
  select private.has_org_role(org_id, array['owner','admin','program_admin','tdm_manager','sustainability_manager','site_manager','analyst','reviewer']);
$$;

alter table public.organization_members drop constraint if exists organization_members_role_check;
alter table public.organization_members add constraint organization_members_role_check check (role in ('owner','admin','program_admin','tdm_manager','sustainability_manager','site_manager','analyst','reviewer','participant'));
alter table public.organization_members drop constraint if exists organization_members_status_check;
alter table public.organization_members add constraint organization_members_status_check check (status in ('active','invited','suspended','disabled'));

alter table public.organizations add column if not exists slug text;
alter table public.organizations add column if not exists onboarding_completed_at timestamptz;
create unique index if not exists organizations_slug_unique on public.organizations(slug) where slug is not null;

create table if not exists public.organization_sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 160),
  site_type text not null default 'other' check (site_type in ('employer','campus','hospital','business_district','venue','municipal','other')),
  address_label text,
  general_zone text,
  timezone text not null default 'America/Los_Angeles',
  parking_capacity integer check (parking_capacity is null or parking_capacity >= 0),
  settings jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists organization_sites_org_idx on public.organization_sites(organization_id);

create table if not exists public.organization_member_sites (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.organization_sites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (site_id, user_id)
);

alter table public.cohorts add column if not exists site_id uuid references public.organization_sites(id) on delete set null;
create index if not exists cohorts_site_idx on public.cohorts(site_id);

create table if not exists public.cohort_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','invited','suspended','removed')),
  joined_at timestamptz not null default now(),
  primary key (cohort_id, user_id)
);

create table if not exists public.tdm_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 180),
  program_type text not null default 'multimodal' check (program_type in ('multimodal','transit','planned_route','parking','access_point','ev_charging','flexible_work','engagement','other')),
  objective text,
  status text not null default 'draft' check (status in ('draft','under_review','active','paused','archived')),
  settings jsonb not null default '{}'::jsonb,
  reporting_period_start date,
  reporting_period_end date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reporting_period_end is null or reporting_period_start is null or reporting_period_end >= reporting_period_start)
);
create index if not exists tdm_programs_org_idx on public.tdm_programs(organization_id);

create table if not exists public.program_sites (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid not null references public.tdm_programs(id) on delete cascade,
  site_id uuid not null references public.organization_sites(id) on delete cascade,
  primary key (program_id, site_id)
);

create table if not exists public.program_cohorts (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid not null references public.tdm_programs(id) on delete cascade,
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  primary key (program_id, cohort_id)
);

create table if not exists public.data_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.organization_sites(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 160),
  source_type text not null check (source_type in ('participant_intake','survey_csv','roster_csv','parking_inventory','parking_occupancy','gtfs','gtfs_rt','ev_charging','hris','sis','manual','other')),
  status text not null default 'not_connected' check (status in ('not_connected','configured','syncing','healthy','partial','error','disabled')),
  last_synced_at timestamptz,
  coverage_summary text,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists data_sources_org_idx on public.data_sources(organization_id);
create index if not exists data_sources_site_idx on public.data_sources(site_id);

create table if not exists public.organization_onboarding (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  organization_profile_complete boolean not null default false,
  site_configured boolean not null default false,
  cohort_configured boolean not null default false,
  program_configured boolean not null default false,
  participant_path_configured boolean not null default false,
  data_source_reviewed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.organization_sites enable row level security;
alter table public.organization_member_sites enable row level security;
alter table public.cohort_members enable row level security;
alter table public.tdm_programs enable row level security;
alter table public.program_sites enable row level security;
alter table public.program_cohorts enable row level security;
alter table public.data_sources enable row level security;
alter table public.organization_onboarding enable row level security;

create policy organization_sites_select on public.organization_sites for select to authenticated using (private.is_org_member(organization_id));
create policy organization_sites_insert on public.organization_sites for insert to authenticated with check (private.can_manage_org(organization_id));
create policy organization_sites_update on public.organization_sites for update to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy organization_sites_delete on public.organization_sites for delete to authenticated using (private.can_manage_org(organization_id));
create policy organization_member_sites_select on public.organization_member_sites for select to authenticated using (user_id = auth.uid() or private.can_manage_org(organization_id));
create policy organization_member_sites_manage on public.organization_member_sites for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy cohort_members_select on public.cohort_members for select to authenticated using (user_id = auth.uid() or private.can_analyze_org(organization_id));
create policy cohort_members_manage on public.cohort_members for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy tdm_programs_select on public.tdm_programs for select to authenticated using (private.is_org_member(organization_id));
create policy tdm_programs_insert on public.tdm_programs for insert to authenticated with check (private.can_manage_org(organization_id));
create policy tdm_programs_update on public.tdm_programs for update to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy tdm_programs_delete on public.tdm_programs for delete to authenticated using (private.can_manage_org(organization_id));
create policy program_sites_select on public.program_sites for select to authenticated using (private.is_org_member(organization_id));
create policy program_sites_manage on public.program_sites for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy program_cohorts_select on public.program_cohorts for select to authenticated using (private.is_org_member(organization_id));
create policy program_cohorts_manage on public.program_cohorts for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy data_sources_select on public.data_sources for select to authenticated using (private.can_analyze_org(organization_id));
create policy data_sources_manage on public.data_sources for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy organization_onboarding_select on public.organization_onboarding for select to authenticated using (private.is_org_member(organization_id));
create policy organization_onboarding_manage on public.organization_onboarding for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));

create trigger organization_sites_set_updated_at before update on public.organization_sites for each row execute function public.set_updated_at();
create trigger tdm_programs_set_updated_at before update on public.tdm_programs for each row execute function public.set_updated_at();
create trigger data_sources_set_updated_at before update on public.data_sources for each row execute function public.set_updated_at();
create trigger organization_onboarding_set_updated_at before update on public.organization_onboarding for each row execute function public.set_updated_at();
create trigger audit_organization_sites after insert or update or delete on public.organization_sites for each row execute function private.write_audit_event();
create trigger audit_tdm_programs after insert or update or delete on public.tdm_programs for each row execute function private.write_audit_event();
create trigger audit_data_sources after insert or update or delete on public.data_sources for each row execute function private.write_audit_event();
create trigger audit_cohort_members after insert or update or delete on public.cohort_members for each row execute function private.write_audit_event();

create or replace function public.create_organization_with_owner(org_name text, org_type text, requested_slug text default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  org_id uuid;
  base_slug text;
  final_slug text;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if char_length(trim(org_name)) < 2 then raise exception 'Organization name is required'; end if;
  if org_type not in ('employer','campus','hospital','business_district','venue','municipality','other') then raise exception 'Unsupported organization type'; end if;
  base_slug := lower(regexp_replace(coalesce(nullif(trim(requested_slug),''), trim(org_name)), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'organization'; end if;
  final_slug := base_slug;
  while exists (select 1 from public.organizations where slug = final_slug) loop
    final_slug := base_slug || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6);
  end loop;
  insert into public.organizations(name, organization_type, status, slug)
  values (trim(org_name), org_type, 'onboarding', final_slug)
  returning id into org_id;
  insert into public.organization_members(organization_id, user_id, role, status)
  values (org_id, uid, 'owner', 'active');
  insert into public.organization_onboarding(organization_id) values (org_id);
  insert into public.profiles(id) values (uid) on conflict (id) do nothing;
  return org_id;
end;
$$;
revoke all on function public.create_organization_with_owner(text,text,text) from public, anon;
grant execute on function public.create_organization_with_owner(text,text,text) to authenticated;

create or replace function public.get_organization_audit_events(org_id uuid, limit_count integer default 100)
returns table(id bigint, occurred_at timestamptz, actor_user_id uuid, table_name text, operation text, row_id text, changed_columns text[])
language sql
stable
security definer
set search_path = public, private, pg_catalog
as $$
  select a.id, a.occurred_at, a.actor_user_id, a.table_name, a.operation, a.row_id, a.changed_columns
  from private.audit_events a
  where a.organization_id = org_id and private.can_analyze_org(org_id)
  order by a.occurred_at desc
  limit greatest(1, least(coalesce(limit_count,100),500));
$$;
revoke all on function public.get_organization_audit_events(uuid,integer) from public, anon;
grant execute on function public.get_organization_audit_events(uuid,integer) to authenticated;
