-- Relay Rider operational engine: invitations, roster/import provenance, tasks, and commute observations.

alter table public.organization_member_sites
  add column if not exists role text not null default 'site_member';

alter table public.organization_member_sites
  drop constraint if exists organization_member_sites_role_check;
alter table public.organization_member_sites
  add constraint organization_member_sites_role_check
  check (role in ('site_member','site_manager','analyst','reviewer','participant'));

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invited_email text not null,
  role text not null check (role in ('admin','program_admin','tdm_manager','sustainability_manager','site_manager','analyst','reviewer','participant')),
  site_id uuid references public.organization_sites(id) on delete set null,
  site_role text check (site_role is null or site_role in ('site_member','site_manager','analyst','reviewer','participant')),
  cohort_id uuid references public.cohorts(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (position('@' in invited_email) > 1)
);
create index if not exists organization_invitations_org_status_idx on public.organization_invitations(organization_id,status);
create index if not exists organization_invitations_email_idx on public.organization_invitations(lower(invited_email));

create table if not exists public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  data_source_id uuid references public.data_sources(id) on delete set null,
  import_type text not null check (import_type in ('cohort_roster','commute_csv')),
  file_name text not null,
  content_sha256 text not null,
  schema_version text not null default 'relay-operational-v1',
  status text not null default 'processing' check (status in ('processing','completed','completed_with_errors','failed')),
  row_count integer not null default 0 check (row_count >= 0),
  valid_row_count integer not null default 0 check (valid_row_count >= 0),
  invalid_row_count integer not null default 0 check (invalid_row_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists ingestion_runs_org_created_idx on public.ingestion_runs(organization_id,created_at desc);
create index if not exists ingestion_runs_source_idx on public.ingestion_runs(data_source_id);

create table if not exists public.ingestion_rows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ingestion_run_id uuid not null references public.ingestion_runs(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  record_type text not null check (record_type in ('roster','commute')),
  raw_record jsonb not null,
  normalized_record jsonb not null default '{}'::jsonb,
  is_valid boolean not null default false,
  validation_errors text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  unique (ingestion_run_id,row_number)
);
create index if not exists ingestion_rows_org_run_idx on public.ingestion_rows(organization_id,ingestion_run_id);
create index if not exists ingestion_rows_invalid_idx on public.ingestion_rows(ingestion_run_id,is_valid) where is_valid = false;

create table if not exists public.participant_roster_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.organization_sites(id) on delete set null,
  external_ref_hash text not null,
  display_ref text not null,
  status text not null default 'staged' check (status in ('staged','active','withdrawn','excluded')),
  source_run_id uuid references public.ingestion_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,external_ref_hash)
);
create index if not exists participant_roster_org_site_idx on public.participant_roster_entries(organization_id,site_id);

create table if not exists public.roster_cohort_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  roster_entry_id uuid not null references public.participant_roster_entries(id) on delete cascade,
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  source_run_id uuid references public.ingestion_runs(id) on delete set null,
  status text not null default 'active' check (status in ('active','removed')),
  created_at timestamptz not null default now(),
  primary key (roster_entry_id,cohort_id)
);
create index if not exists roster_cohort_memberships_org_idx on public.roster_cohort_memberships(organization_id);
create index if not exists roster_cohort_memberships_cohort_idx on public.roster_cohort_memberships(cohort_id,status);

create table if not exists public.commute_observations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.organization_sites(id) on delete set null,
  cohort_id uuid references public.cohorts(id) on delete set null,
  roster_entry_id uuid references public.participant_roster_entries(id) on delete set null,
  source_run_id uuid not null references public.ingestion_runs(id) on delete cascade,
  source_row_id uuid not null references public.ingestion_rows(id) on delete cascade,
  origin_zone text not null,
  destination_zone text not null,
  travel_days smallint[] not null default '{}'::smallint[],
  arrival_start time,
  arrival_end time,
  return_start time,
  return_end time,
  flexibility_minutes integer not null default 0 check (flexibility_minutes between 0 and 240),
  current_mode text,
  parking_difficulty smallint check (parking_difficulty is null or parking_difficulty between 1 and 5),
  access_point_willing boolean not null default false,
  ev_hybrid_status text not null default 'unknown' check (ev_hybrid_status in ('ev','hybrid','plug_in_hybrid','ice','unknown','prefer_ev_hybrid')),
  approximate_zones boolean not null default true check (approximate_zones = true),
  status text not null default 'active' check (status in ('active','excluded','withdrawn')),
  created_at timestamptz not null default now(),
  unique (source_row_id)
);
create index if not exists commute_observations_org_corridor_idx on public.commute_observations(organization_id,origin_zone,destination_zone);
create index if not exists commute_observations_site_idx on public.commute_observations(site_id);
create index if not exists commute_observations_cohort_idx on public.commute_observations(cohort_id);
create index if not exists commute_observations_roster_idx on public.commute_observations(roster_entry_id);

create table if not exists public.operational_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category text not null check (category in ('ingestion_validation','invitation_followup','cohort_review','program_assignment','corridor_review','match_review','data_quality','other')),
  status text not null default 'open' check (status in ('open','in_progress','resolved','dismissed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  title text not null,
  detail text,
  subject_type text,
  subject_id text,
  assigned_to uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists operational_tasks_org_status_idx on public.operational_tasks(organization_id,status,priority,created_at desc);
create index if not exists operational_tasks_assignee_idx on public.operational_tasks(assigned_to,status);

alter table public.organization_invitations enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.ingestion_rows enable row level security;
alter table public.participant_roster_entries enable row level security;
alter table public.roster_cohort_memberships enable row level security;
alter table public.commute_observations enable row level security;
alter table public.operational_tasks enable row level security;

create policy organization_invitations_select on public.organization_invitations for select to authenticated using (private.can_manage_org(organization_id));
create policy organization_invitations_update on public.organization_invitations for update to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy organization_invitations_delete on public.organization_invitations for delete to authenticated using (private.can_manage_org(organization_id));

create policy ingestion_runs_select on public.ingestion_runs for select to authenticated using (private.can_analyze_org(organization_id));
create policy ingestion_runs_insert on public.ingestion_runs for insert to authenticated with check (private.can_manage_org(organization_id));
create policy ingestion_runs_update on public.ingestion_runs for update to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy ingestion_runs_delete on public.ingestion_runs for delete to authenticated using (private.can_manage_org(organization_id));

create policy ingestion_rows_select on public.ingestion_rows for select to authenticated using (private.can_analyze_org(organization_id));
create policy ingestion_rows_insert on public.ingestion_rows for insert to authenticated with check (private.can_manage_org(organization_id));
create policy ingestion_rows_update on public.ingestion_rows for update to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy ingestion_rows_delete on public.ingestion_rows for delete to authenticated using (private.can_manage_org(organization_id));

create policy participant_roster_entries_select on public.participant_roster_entries for select to authenticated using (private.can_analyze_org(organization_id));
create policy participant_roster_entries_insert on public.participant_roster_entries for insert to authenticated with check (private.can_manage_org(organization_id));
create policy participant_roster_entries_update on public.participant_roster_entries for update to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy participant_roster_entries_delete on public.participant_roster_entries for delete to authenticated using (private.can_manage_org(organization_id));

create policy roster_cohort_memberships_select on public.roster_cohort_memberships for select to authenticated using (private.can_analyze_org(organization_id));
create policy roster_cohort_memberships_insert on public.roster_cohort_memberships for insert to authenticated with check (private.can_manage_org(organization_id));
create policy roster_cohort_memberships_update on public.roster_cohort_memberships for update to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy roster_cohort_memberships_delete on public.roster_cohort_memberships for delete to authenticated using (private.can_manage_org(organization_id));

create policy commute_observations_select on public.commute_observations for select to authenticated using (private.can_analyze_org(organization_id));
create policy commute_observations_insert on public.commute_observations for insert to authenticated with check (private.can_manage_org(organization_id));
create policy commute_observations_update on public.commute_observations for update to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy commute_observations_delete on public.commute_observations for delete to authenticated using (private.can_manage_org(organization_id));

create policy operational_tasks_select on public.operational_tasks for select to authenticated using (private.can_analyze_org(organization_id));
create policy operational_tasks_insert on public.operational_tasks for insert to authenticated with check (private.can_manage_org(organization_id) or private.can_review_org(organization_id));
create policy operational_tasks_update on public.operational_tasks for update to authenticated using (private.can_review_org(organization_id)) with check (private.can_review_org(organization_id));
create policy operational_tasks_delete on public.operational_tasks for delete to authenticated using (private.can_manage_org(organization_id));

create trigger organization_invitations_set_updated_at before update on public.organization_invitations for each row execute function public.set_updated_at();
create trigger participant_roster_entries_set_updated_at before update on public.participant_roster_entries for each row execute function public.set_updated_at();
create trigger operational_tasks_set_updated_at before update on public.operational_tasks for each row execute function public.set_updated_at();

create trigger audit_organization_invitations after insert or update or delete on public.organization_invitations for each row execute function private.write_audit_event();
create trigger audit_ingestion_runs after insert or update or delete on public.ingestion_runs for each row execute function private.write_audit_event();
create trigger audit_participant_roster_entries after insert or update or delete on public.participant_roster_entries for each row execute function private.write_audit_event();
create trigger audit_operational_tasks after insert or update or delete on public.operational_tasks for each row execute function private.write_audit_event();
