-- Relay Rider Rule 2202 persistence layer.
-- Keeps compliance records tenant-scoped and employee/worksite-only.

create table if not exists public.rule2202_reporting_years (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.organization_sites(id) on delete cascade,
  reporting_year integer not null check (reporting_year between 2025 and 2100),
  status text not null default 'draft' check (status in ('draft','in_progress','blocked','ready_for_review','reviewed','filed','archived')),
  vmt_pathway text check (vmt_pathway is null or vmt_pathway in ('avr_survey','anonymized_zip')),
  survey_format text check (survey_format is null or survey_format in ('five_day','seven_day')),
  methodology_version text not null default 'AQMD_RULE_2202_2026',
  annual_due_date date,
  business_classification text,
  etc_contact_name text,
  etc_contact_email text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, reporting_year)
);
create index if not exists rule2202_reporting_years_org_idx on public.rule2202_reporting_years(organization_id);
create index if not exists rule2202_reporting_years_site_idx on public.rule2202_reporting_years(site_id);

create table if not exists public.rule2202_employee_populations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.organization_sites(id) on delete cascade,
  reporting_year_id uuid not null references public.rule2202_reporting_years(id) on delete cascade,
  total_employee_count integer check (total_employee_count is null or total_employee_count >= 0),
  peak_window_employee_count integer check (peak_window_employee_count is null or peak_window_employee_count >= 0),
  source_id uuid references public.data_sources(id) on delete set null,
  source_label text,
  as_of_date date,
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reporting_year_id)
);
create index if not exists rule2202_employee_populations_org_idx on public.rule2202_employee_populations(organization_id);

create table if not exists public.rule2202_validation_issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.organization_sites(id) on delete cascade,
  reporting_year_id uuid not null references public.rule2202_reporting_years(id) on delete cascade,
  source_id uuid references public.data_sources(id) on delete set null,
  source_row_key text,
  rule_code text not null,
  severity text not null check (severity in ('blocking','review','warning')),
  field_name text,
  message text not null,
  status text not null default 'open' check (status in ('open','resolved','excluded','accepted')),
  resolution_note text,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists rule2202_validation_issues_year_idx on public.rule2202_validation_issues(reporting_year_id, status, severity);
create index if not exists rule2202_validation_issues_org_idx on public.rule2202_validation_issues(organization_id);

create table if not exists public.rule2202_calculation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.organization_sites(id) on delete cascade,
  reporting_year_id uuid not null references public.rule2202_reporting_years(id) on delete cascade,
  calculation_type text not null check (calculation_type in ('avr','weekly_vmt','telecommute','package_readiness')),
  methodology_version text not null default 'AQMD_RULE_2202_2026',
  status text not null default 'pending' check (status in ('pending','running','succeeded','failed','superseded')),
  input_record_count integer not null default 0 check (input_record_count >= 0),
  excluded_record_count integer not null default 0 check (excluded_record_count >= 0),
  result_value numeric,
  result_unit text,
  result_payload jsonb not null default '{}'::jsonb,
  input_snapshot jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists rule2202_calculation_runs_year_idx on public.rule2202_calculation_runs(reporting_year_id, calculation_type, created_at desc);
create index if not exists rule2202_calculation_runs_org_idx on public.rule2202_calculation_runs(organization_id);

create table if not exists public.rule2202_compliance_packages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.organization_sites(id) on delete cascade,
  reporting_year_id uuid not null references public.rule2202_reporting_years(id) on delete cascade,
  version integer not null default 1 check (version >= 1),
  status text not null default 'draft' check (status in ('draft','blocked','ready_for_review','reviewed','filed','superseded')),
  readiness_snapshot jsonb not null default '{}'::jsonb,
  source_snapshot jsonb not null default '{}'::jsonb,
  generated_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  filed_at timestamptz,
  filing_reference text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reporting_year_id, version)
);
create index if not exists rule2202_compliance_packages_year_idx on public.rule2202_compliance_packages(reporting_year_id, version desc);
create index if not exists rule2202_compliance_packages_org_idx on public.rule2202_compliance_packages(organization_id);

alter table public.rule2202_reporting_years enable row level security;
alter table public.rule2202_employee_populations enable row level security;
alter table public.rule2202_validation_issues enable row level security;
alter table public.rule2202_calculation_runs enable row level security;
alter table public.rule2202_compliance_packages enable row level security;

create policy rule2202_reporting_years_select on public.rule2202_reporting_years for select to authenticated using (private.can_analyze_org(organization_id));
create policy rule2202_reporting_years_manage on public.rule2202_reporting_years for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy rule2202_employee_populations_select on public.rule2202_employee_populations for select to authenticated using (private.can_analyze_org(organization_id));
create policy rule2202_employee_populations_manage on public.rule2202_employee_populations for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy rule2202_validation_issues_select on public.rule2202_validation_issues for select to authenticated using (private.can_analyze_org(organization_id));
create policy rule2202_validation_issues_manage on public.rule2202_validation_issues for all to authenticated using (private.can_review_org(organization_id)) with check (private.can_review_org(organization_id));
create policy rule2202_calculation_runs_select on public.rule2202_calculation_runs for select to authenticated using (private.can_analyze_org(organization_id));
create policy rule2202_calculation_runs_manage on public.rule2202_calculation_runs for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));
create policy rule2202_compliance_packages_select on public.rule2202_compliance_packages for select to authenticated using (private.can_analyze_org(organization_id));
create policy rule2202_compliance_packages_manage on public.rule2202_compliance_packages for all to authenticated using (private.can_manage_org(organization_id)) with check (private.can_manage_org(organization_id));

create trigger rule2202_reporting_years_set_updated_at before update on public.rule2202_reporting_years for each row execute function public.set_updated_at();
create trigger rule2202_employee_populations_set_updated_at before update on public.rule2202_employee_populations for each row execute function public.set_updated_at();
create trigger rule2202_validation_issues_set_updated_at before update on public.rule2202_validation_issues for each row execute function public.set_updated_at();
create trigger rule2202_compliance_packages_set_updated_at before update on public.rule2202_compliance_packages for each row execute function public.set_updated_at();

create trigger audit_rule2202_reporting_years after insert or update or delete on public.rule2202_reporting_years for each row execute function private.write_audit_event();
create trigger audit_rule2202_employee_populations after insert or update or delete on public.rule2202_employee_populations for each row execute function private.write_audit_event();
create trigger audit_rule2202_validation_issues after insert or update or delete on public.rule2202_validation_issues for each row execute function private.write_audit_event();
create trigger audit_rule2202_calculation_runs after insert or update or delete on public.rule2202_calculation_runs for each row execute function private.write_audit_event();
create trigger audit_rule2202_compliance_packages after insert or update or delete on public.rule2202_compliance_packages for each row execute function private.write_audit_event();
