-- ETC dashboard read API for the Rule 2202 operations workspace.
-- Returns a tenant-scoped, source-backed overview assembled from existing persistence tables.
-- This function does not certify compliance and does not write filing records.

create or replace function public.get_rule2202_etc_overview(
  p_org_id uuid,
  p_site_id uuid,
  p_reporting_year_id uuid default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, private, pg_catalog
as $$
declare
  cycle_row public.rule2202_reporting_years%rowtype;
  population_row public.rule2202_employee_populations%rowtype;
  cycle_id uuid;
  open_issue_count integer := 0;
  blocking_issue_count integer := 0;
  review_issue_count integer := 0;
  successful_calculation_count integer := 0;
  package_ready boolean := false;
  profile_ready boolean := false;
  population_ready boolean := false;
  pathway_ready boolean := false;
  validation_ready boolean := false;
  calculation_ready boolean := false;
  readiness_ready integer := 0;
  readiness_total integer := 6;
  task_rows jsonb := '[]'::jsonb;
  deadline_rows jsonb := '[]'::jsonb;
  evidence_health jsonb := '{}'::jsonb;
  step_rows jsonb := '[]'::jsonb;
  cycle_status text;
  readiness_label text;
  worksite_name text;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if not private.can_analyze_org(p_org_id) then
    raise exception using errcode = '42501', message = 'Organization access denied';
  end if;

  if not exists (
    select 1 from public.organization_sites s
    where s.id = p_site_id and s.organization_id = p_org_id
  ) then
    raise exception using errcode = '22023', message = 'Worksite does not belong to organization';
  end if;

  if p_reporting_year_id is null then
    select ry.id into cycle_id
    from public.rule2202_reporting_years ry
    where ry.organization_id = p_org_id and ry.site_id = p_site_id
    order by ry.reporting_year desc
    limit 1;
  else
    cycle_id := p_reporting_year_id;
  end if;

  if cycle_id is null then
    return jsonb_build_object(
      'status', 'not_configured',
      'worksite', jsonb_build_object('organization_id', p_org_id, 'site_id', p_site_id),
      'cycle', null,
      'readiness', jsonb_build_object('ready', 0, 'total', readiness_total, 'percent', 0, 'label', 'No reporting cycle has been configured.'),
      'steps', jsonb_build_array(
        jsonb_build_object('id','applicability','label','Applicability','detail','Create reporting cycle','status','blocked'),
        jsonb_build_object('id','population','label','Population','detail','Connect employee count','status','not_started'),
        jsonb_build_object('id','survey-vmt','label','Survey / VMT','detail','Select pathway','status','not_started'),
        jsonb_build_object('id','validation','label','Validate','detail','Resolve issues','status','not_started'),
        jsonb_build_object('id','package','label','Package','detail','Prepare draft','status','not_started')
      ),
      'tasks', jsonb_build_array(jsonb_build_object(
        'id', 'create-cycle', 'title', 'Create reporting cycle',
        'description', 'Set up the worksite and annual reporting cycle before collecting evidence.',
        'owner', 'ETC', 'due_label', 'Not scheduled', 'status', 'blocking'
      )),
      'evidence', jsonb_build_object('verified',0,'self_reported',0,'needs_correction',0,'missing',readiness_total),
      'deadlines', '[]'::jsonb
    );
  end if;

  select ry.* into cycle_row
  from public.rule2202_reporting_years ry
  where ry.id = cycle_id and ry.organization_id = p_org_id and ry.site_id = p_site_id;

  if not found then
    raise exception using errcode = '22023', message = 'Reporting cycle not found for worksite';
  end if;

  select coalesce(s.name, 'Worksite') into worksite_name
  from public.organization_sites s where s.id = p_site_id;

  select ep.* into population_row
  from public.rule2202_employee_populations ep
  where ep.reporting_year_id = cycle_id
    and ep.organization_id = p_org_id
    and ep.site_id = p_site_id
  limit 1;

  select count(*) into open_issue_count
  from public.rule2202_validation_issues vi
  where vi.reporting_year_id = cycle_id and vi.organization_id = p_org_id and vi.status = 'open';

  select count(*) into blocking_issue_count
  from public.rule2202_validation_issues vi
  where vi.reporting_year_id = cycle_id and vi.organization_id = p_org_id
    and vi.status = 'open' and vi.severity = 'blocking';

  select count(*) into review_issue_count
  from public.rule2202_validation_issues vi
  where vi.reporting_year_id = cycle_id and vi.organization_id = p_org_id
    and vi.status = 'open' and vi.severity = 'review';

  select count(*) into successful_calculation_count
  from public.rule2202_calculation_runs cr
  where cr.reporting_year_id = cycle_id and cr.organization_id = p_org_id
    and cr.status = 'succeeded';

  select exists (
    select 1 from public.rule2202_compliance_packages cp
    where cp.reporting_year_id = cycle_id and cp.organization_id = p_org_id
      and cp.status in ('ready_for_review','reviewed','filed')
  ) into package_ready;

  profile_ready := cycle_row.business_classification is not null
    and nullif(trim(coalesce(cycle_row.etc_contact_name, '')), '') is not null
    and nullif(trim(coalesce(cycle_row.etc_contact_email, '')), '') is not null;
  population_ready := population_row.id is not null and population_row.total_employee_count is not null;
  pathway_ready := cycle_row.vmt_pathway is not null;
  validation_ready := blocking_issue_count = 0;
  calculation_ready := successful_calculation_count > 0;

  readiness_ready := (case when profile_ready then 1 else 0 end)
    + (case when population_ready then 1 else 0 end)
    + (case when pathway_ready then 1 else 0 end)
    + (case when validation_ready then 1 else 0 end)
    + (case when calculation_ready then 1 else 0 end)
    + (case when package_ready then 1 else 0 end);

  if readiness_ready = readiness_total then
    readiness_label := 'Ready for responsible-official review.';
  elsif blocking_issue_count > 0 or not profile_ready or not population_ready then
    readiness_label := 'Needs employer data before a package can be prepared.';
  elsif review_issue_count > 0 then
    readiness_label := 'Resolve review items before package generation.';
  else
    readiness_label := 'Collection and calculation work is in progress.';
  end if;

  task_rows := jsonb_build_array();
  if not profile_ready then
    task_rows := task_rows || jsonb_build_array(jsonb_build_object(
      'id','confirm-profile','title','Confirm worksite applicability',
      'description','Business classification and ETC contact details are required.',
      'owner','ETC','due_label',coalesce(cycle_row.annual_due_date::text,'Not confirmed'),'status','blocking'
    ));
  end if;
  if not population_ready then
    task_rows := task_rows || jsonb_build_array(jsonb_build_object(
      'id','employee-population','title','Connect employee population',
      'description','Add a source-backed employee-count snapshot for this reporting cycle.',
      'owner','ETC','due_label','Not scheduled','status','required'
    ));
  end if;
  if not pathway_ready then
    task_rows := task_rows || jsonb_build_array(jsonb_build_object(
      'id','select-pathway','title','Select VMT reporting pathway',
      'description','Choose the configured AVR survey or anonymized ZIP-code workflow.',
      'owner','ETC','due_label','Not scheduled','status','required'
    ));
  end if;
  if blocking_issue_count > 0 or review_issue_count > 0 then
    task_rows := task_rows || jsonb_build_array(jsonb_build_object(
      'id','validation-queue','title','Resolve validation issues',
      'description',format('%s blocking and %s review items are open.', blocking_issue_count, review_issue_count),
      'owner','Analyst','due_label','Review now','status',case when blocking_issue_count > 0 then 'blocking' else 'required' end
    ));
  end if;
  if not calculation_ready then
    task_rows := task_rows || jsonb_build_array(jsonb_build_object(
      'id','calculation','title','Run documented calculation',
      'description','A successful versioned calculation is required before package review.',
      'owner','Analyst','due_label','Not scheduled','status','required'
    ));
  end if;
  if not package_ready then
    task_rows := task_rows || jsonb_build_array(jsonb_build_object(
      'id','package','title','Prepare draft package',
      'description','Generate a human-reviewed draft after required evidence is accepted.',
      'owner','ETC','due_label','Not scheduled','status','required'
    ));
  end if;

  if cycle_row.annual_due_date is not null then
    deadline_rows := jsonb_build_array(jsonb_build_object(
      'id','annual-registration','task','Annual registration','owner','ETC',
      'due',cycle_row.annual_due_date::text,
      'status',case when cycle_row.annual_due_date < current_date and cycle_row.status <> 'filed' then 'Overdue' else 'Open' end
    ));
  end if;
  deadline_rows := deadline_rows || jsonb_build_array(
    jsonb_build_object('id','survey','task','Launch commute survey','owner','ETC','due','Not scheduled','status',case when pathway_ready then 'Open' else 'Waiting' end),
    jsonb_build_object('id','review','task','Review imported commute data','owner','Analyst','due','Not scheduled','status',case when population_ready then 'Open' else 'Waiting' end),
    jsonb_build_object('id','approval','task','Approve draft package','owner','Responsible official','due','—','status',case when package_ready then 'Open' else 'Waiting' end)
  );

  evidence_health := jsonb_build_object(
    'verified', (case when population_row.confirmed_at is not null then 1 else 0 end) + successful_calculation_count,
    'self_reported', (case when population_row.id is not null and population_row.confirmed_at is null then 1 else 0 end),
    'needs_correction', review_issue_count,
    'missing', (case when not profile_ready then 1 else 0 end) + (case when not population_ready then 1 else 0 end) + (case when not pathway_ready then 1 else 0 end) + (case when not calculation_ready then 1 else 0 end)
  );

  step_rows := jsonb_build_array(
    jsonb_build_object('id','applicability','label','Applicability','detail','Confirm subjectivity','status',case when profile_ready then 'ready' else 'blocked' end),
    jsonb_build_object('id','population','label','Population','detail','Connect employee count','status',case when population_ready then 'ready' else 'not_started' end),
    jsonb_build_object('id','survey-vmt','label','Survey / VMT','detail','Select pathway','status',case when pathway_ready then 'ready' else 'not_started' end),
    jsonb_build_object('id','validation','label','Validate','detail','Resolve issues','status',case when validation_ready and (population_ready or pathway_ready) then 'ready' when blocking_issue_count > 0 or review_issue_count > 0 then 'review' else 'not_started' end),
    jsonb_build_object('id','package','label','Package','detail','Prepare draft','status',case when package_ready then 'ready' when calculation_ready then 'review' else 'not_started' end)
  );

  cycle_status := case
    when readiness_ready = readiness_total then 'ready_for_review'
    when blocking_issue_count > 0 or not profile_ready or not population_ready then 'blocked'
    when readiness_ready > 0 then 'in_progress'
    else cycle_row.status
  end;

  return jsonb_build_object(
    'status', cycle_status,
    'worksite', jsonb_build_object('organization_id', p_org_id, 'site_id', p_site_id, 'name', worksite_name),
    'cycle', jsonb_build_object(
      'id', cycle_row.id, 'reporting_year', cycle_row.reporting_year, 'status', cycle_row.status,
      'vmt_pathway', cycle_row.vmt_pathway, 'survey_format', cycle_row.survey_format,
      'methodology_version', cycle_row.methodology_version, 'annual_due_date', cycle_row.annual_due_date,
      'business_classification', cycle_row.business_classification,
      'etc_contact_name', cycle_row.etc_contact_name, 'etc_contact_email', cycle_row.etc_contact_email
    ),
    'readiness', jsonb_build_object('ready',readiness_ready,'total',readiness_total,'percent',round(readiness_ready::numeric / readiness_total * 100),'label',readiness_label),
    'steps', step_rows,
    'tasks', task_rows,
    'evidence', evidence_health,
    'deadlines', deadline_rows,
    'issue_counts', jsonb_build_object('open',open_issue_count,'blocking',blocking_issue_count,'review',review_issue_count),
    'calculation_count', successful_calculation_count,
    'package_ready', package_ready,
    'generated_at', now()
  );
end;
$$;

revoke all on function public.get_rule2202_etc_overview(uuid,uuid,uuid) from public, anon;
grant execute on function public.get_rule2202_etc_overview(uuid,uuid,uuid) to authenticated;
