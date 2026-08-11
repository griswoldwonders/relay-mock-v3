-- Relay Rider PCC / institutional evidence engine
-- Dedicated evidence tables avoid colliding with the existing operational commute_observations ingestion schema.

create table if not exists public.evidence_baselines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.organization_sites(id) on delete cascade,
  cohort_id uuid references public.cohorts(id) on delete set null,
  source_id uuid references public.data_sources(id) on delete set null,
  name text not null check (char_length(name) between 2 and 180),
  status text not null default 'draft' check (status in ('draft','validated','locked','superseded','archived')),
  baseline_start date not null,
  baseline_end date not null,
  methodology_version text not null default 'RR_VMT_METHOD_v0.1',
  input_record_count integer not null default 0 check (input_record_count >= 0),
  valid_record_count integer not null default 0 check (valid_record_count >= 0),
  blocking_issue_count integer not null default 0 check (blocking_issue_count >= 0),
  input_hash text,
  locked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (baseline_end >= baseline_start)
);
create index if not exists evidence_baselines_org_site_idx on public.evidence_baselines(organization_id, site_id, created_at desc);

create table if not exists public.evidence_observation_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.organization_sites(id) on delete cascade,
  cohort_id uuid references public.cohorts(id) on delete set null,
  baseline_id uuid references public.evidence_baselines(id) on delete set null,
  source_id uuid references public.data_sources(id) on delete set null,
  name text not null check (char_length(name) between 2 and 180),
  status text not null default 'draft' check (status in ('draft','collecting','validated','locked','archived')),
  observation_start date not null,
  observation_end date not null,
  methodology_version text not null default 'RR_VMT_METHOD_v0.1',
  input_record_count integer not null default 0 check (input_record_count >= 0),
  valid_record_count integer not null default 0 check (valid_record_count >= 0),
  blocking_issue_count integer not null default 0 check (blocking_issue_count >= 0),
  input_hash text,
  locked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (observation_end >= observation_start)
);
create index if not exists evidence_periods_org_site_idx on public.evidence_observation_periods(organization_id, site_id, created_at desc);

create table if not exists public.evidence_commute_observations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.organization_sites(id) on delete cascade,
  cohort_id uuid references public.cohorts(id) on delete set null,
  baseline_id uuid references public.evidence_baselines(id) on delete cascade,
  observation_period_id uuid references public.evidence_observation_periods(id) on delete cascade,
  source_id uuid references public.data_sources(id) on delete set null,
  participant_key text not null check (char_length(participant_key) between 1 and 128),
  observation_date date not null,
  origin_zone text,
  commute_mode text not null check (commute_mode in ('drive_alone','carpool','vanpool','bus','rail','walk','bike','remote','compressed_day_off','worked_offsite','absent','other','unknown')),
  source_mode text,
  one_way_miles numeric(8,2) check (one_way_miles is null or one_way_miles >= 0),
  vehicle_occupancy numeric(5,2) check (vehicle_occupancy is null or vehicle_occupancy >= 0),
  reported_to_site boolean not null default true,
  remote_day boolean not null default false,
  ev_hybrid_status text not null default 'unknown' check (ev_hybrid_status in ('ev','plug_in_hybrid','hybrid','ice','unknown','not_applicable')),
  parking_difficulty smallint check (parking_difficulty is null or parking_difficulty between 1 and 5),
  arrival_window text,
  departure_window text,
  validation_status text not null default 'unvalidated' check (validation_status in ('unvalidated','valid','warning','blocking_error','excluded')),
  exclusion_reason text,
  source_row_number integer,
  original_payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((baseline_id is not null)::int + (observation_period_id is not null)::int = 1)
);
create index if not exists evidence_commute_period_idx on public.evidence_commute_observations(organization_id, site_id, baseline_id, observation_period_id);
create index if not exists evidence_commute_participant_date_idx on public.evidence_commute_observations(organization_id, participant_key, observation_date);

create table if not exists public.evidence_validation_issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.organization_sites(id) on delete cascade,
  commute_observation_id uuid references public.evidence_commute_observations(id) on delete cascade,
  baseline_id uuid references public.evidence_baselines(id) on delete cascade,
  observation_period_id uuid references public.evidence_observation_periods(id) on delete cascade,
  rule_code text not null,
  severity text not null check (severity in ('blocking_error','review_required','warning','informational')),
  message text not null,
  resolution_hint text,
  status text not null default 'open' check (status in ('open','resolved','accepted','excluded')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists evidence_validation_period_idx on public.evidence_validation_issues(organization_id, site_id, status, severity);

create table if not exists public.evidence_metric_values (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.organization_sites(id) on delete cascade,
  cohort_id uuid references public.cohorts(id) on delete set null,
  baseline_id uuid references public.evidence_baselines(id) on delete cascade,
  observation_period_id uuid references public.evidence_observation_periods(id) on delete cascade,
  metric_key text not null,
  metric_value numeric(16,4),
  unit text not null,
  numerator numeric(16,4),
  denominator numeric(16,4),
  sample_size integer,
  evidence_class text not null check (evidence_class in ('official_estimate','institution_supplied','participant_reported','relay_observed','relay_modeled','unavailable')),
  source_label text not null,
  source_vintage text,
  geography_label text,
  methodology_version text not null,
  methodology_note text,
  limitation_note text,
  calculated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  check ((baseline_id is not null)::int + (observation_period_id is not null)::int <= 1)
);
create index if not exists evidence_metric_values_lookup_idx on public.evidence_metric_values(organization_id, site_id, metric_key, calculated_at desc);

create table if not exists public.evidence_findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.organization_sites(id) on delete cascade,
  baseline_id uuid references public.evidence_baselines(id) on delete set null,
  observation_period_id uuid references public.evidence_observation_periods(id) on delete set null,
  finding text not null,
  evidence_summary text not null,
  limitation text,
  potential_action text,
  evidence_strength text not null default 'descriptive' check (evidence_strength in ('descriptive','comparative','associational','causal_not_established')),
  status text not null default 'draft' check (status in ('draft','reviewed','published','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.evidence_baselines enable row level security;
alter table public.evidence_observation_periods enable row level security;
alter table public.evidence_commute_observations enable row level security;
alter table public.evidence_validation_issues enable row level security;
alter table public.evidence_metric_values enable row level security;
alter table public.evidence_findings enable row level security;

create policy evidence_baselines_select on public.evidence_baselines for select to authenticated using (private.can_analyze_org(organization_id));
create policy evidence_baselines_manage on public.evidence_baselines for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy evidence_periods_select on public.evidence_observation_periods for select to authenticated using (private.can_analyze_org(organization_id));
create policy evidence_periods_manage on public.evidence_observation_periods for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy evidence_commute_select on public.evidence_commute_observations for select to authenticated using (private.can_analyze_org(organization_id));
create policy evidence_commute_manage on public.evidence_commute_observations for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy evidence_validation_select on public.evidence_validation_issues for select to authenticated using (private.can_analyze_org(organization_id));
create policy evidence_validation_manage on public.evidence_validation_issues for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy evidence_metric_values_select on public.evidence_metric_values for select to authenticated using (private.can_analyze_org(organization_id));
create policy evidence_metric_values_manage on public.evidence_metric_values for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy evidence_findings_select on public.evidence_findings for select to authenticated using (private.can_analyze_org(organization_id));
create policy evidence_findings_manage on public.evidence_findings for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));

create trigger evidence_baselines_set_updated_at before update on public.evidence_baselines for each row execute function public.set_updated_at();
create trigger evidence_periods_set_updated_at before update on public.evidence_observation_periods for each row execute function public.set_updated_at();
create trigger evidence_commute_set_updated_at before update on public.evidence_commute_observations for each row execute function public.set_updated_at();
create trigger evidence_findings_set_updated_at before update on public.evidence_findings for each row execute function public.set_updated_at();

create trigger audit_evidence_baselines after insert or update or delete on public.evidence_baselines for each row execute function private.write_audit_event();
create trigger audit_evidence_periods after insert or update or delete on public.evidence_observation_periods for each row execute function private.write_audit_event();
create trigger audit_evidence_commute after insert or update or delete on public.evidence_commute_observations for each row execute function private.write_audit_event();
create trigger audit_evidence_metric_values after insert or update or delete on public.evidence_metric_values for each row execute function private.write_audit_event();
create trigger audit_evidence_findings after insert or update or delete on public.evidence_findings for each row execute function private.write_audit_event();

create or replace function public.lock_evidence_baseline(target_baseline uuid)
returns public.evidence_baselines
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare result public.evidence_baselines;
begin
  select * into result from public.evidence_baselines where id = target_baseline;
  if result.id is null then raise exception 'Baseline not found'; end if;
  if not private.can_manage_org(result.organization_id) then raise exception 'Permission denied'; end if;
  if result.blocking_issue_count > 0 then raise exception 'Resolve blocking validation issues before locking'; end if;
  if result.valid_record_count <= 0 then raise exception 'At least one validated commute record is required'; end if;
  update public.evidence_baselines set status='locked', locked_at=now() where id=target_baseline returning * into result;
  return result;
end;
$$;
revoke all on function public.lock_evidence_baseline(uuid) from public, anon;
grant execute on function public.lock_evidence_baseline(uuid) to authenticated;
