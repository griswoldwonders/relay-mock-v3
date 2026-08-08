-- Relay Rider operational engine hardening: fixed search path, FK indexes, and minimized ingestion provenance.

alter function private.time_to_minutes(time) set search_path = pg_catalog;

create index if not exists commute_observations_source_run_idx on public.commute_observations(source_run_id);
create index if not exists ingestion_runs_created_by_idx on public.ingestion_runs(created_by);
create index if not exists operational_tasks_created_by_idx on public.operational_tasks(created_by);
create index if not exists organization_invitations_accepted_by_idx on public.organization_invitations(accepted_by);
create index if not exists organization_invitations_cohort_idx on public.organization_invitations(cohort_id);
create index if not exists organization_invitations_invited_by_idx on public.organization_invitations(invited_by);
create index if not exists organization_invitations_site_idx on public.organization_invitations(site_id);
create index if not exists participant_roster_entries_site_idx on public.participant_roster_entries(site_id);
create index if not exists participant_roster_entries_source_run_idx on public.participant_roster_entries(source_run_id);
create index if not exists roster_cohort_memberships_source_run_idx on public.roster_cohort_memberships(source_run_id);

-- Participant references are identity-linkage inputs, not useful plaintext provenance.
-- Keep them hashed in participant_roster_entries and masked in normalized records.
update public.ingestion_rows
set raw_record = raw_record - 'participant_ref' - 'employee_id' - 'student_id' - 'id'
where raw_record ?| array['participant_ref','employee_id','student_id','id'];

create or replace function public.import_cohort_roster(
  org_id uuid,
  cohort_id uuid,
  source_id uuid,
  file_name text,
  content_sha256 text,
  rows jsonb,
  default_site_id uuid default null
)
returns table(run_id uuid, row_count integer, valid_row_count integer, invalid_row_count integer, status text)
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  new_run uuid;
  item jsonb;
  stored_item jsonb;
  row_no bigint;
  errors text[];
  raw_ref text;
  ref_hash text;
  masked_ref text;
  roster_id uuid;
  valid_count integer := 0;
  invalid_count integer := 0;
  total_count integer := 0;
  final_status text;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if not private.can_manage_org(org_id) then raise exception 'Organization management permission required'; end if;
  if jsonb_typeof(rows) <> 'array' then raise exception 'Rows must be a JSON array'; end if;
  if coalesce(trim(file_name),'') = '' then raise exception 'File name required'; end if;
  if coalesce(content_sha256,'') !~ '^[0-9a-fA-F]{64}$' then raise exception 'SHA-256 content hash required'; end if;
  if not exists(select 1 from public.cohorts c where c.id=cohort_id and c.organization_id=org_id) then raise exception 'Cohort does not belong to organization'; end if;
  if source_id is not null and not exists(select 1 from public.data_sources d where d.id=source_id and d.organization_id=org_id) then raise exception 'Data source does not belong to organization'; end if;
  if default_site_id is not null and not exists(select 1 from public.organization_sites s where s.id=default_site_id and s.organization_id=org_id) then raise exception 'Site does not belong to organization'; end if;

  insert into public.ingestion_runs(organization_id,data_source_id,import_type,file_name,content_sha256,created_by)
  values(org_id,source_id,'cohort_roster',trim(file_name),lower(content_sha256),uid)
  returning id into new_run;

  for item,row_no in select value,ordinality from jsonb_array_elements(rows) with ordinality loop
    total_count := total_count + 1;
    errors := '{}'::text[];
    raw_ref := trim(coalesce(item->>'participant_ref',''));
    stored_item := item - 'participant_ref' - 'employee_id' - 'student_id' - 'id';

    if raw_ref = '' then errors := array_append(errors,'participant_ref is required'); end if;
    if char_length(raw_ref) > 160 then errors := array_append(errors,'participant_ref exceeds 160 characters'); end if;

    if cardinality(errors)=0 then
      ref_hash := encode(digest(raw_ref,'sha256'),'hex');
      masked_ref := case when char_length(raw_ref) <= 4 then '…' || right(raw_ref,1) else '…' || right(raw_ref,4) end;

      insert into public.ingestion_rows(organization_id,ingestion_run_id,row_number,record_type,raw_record,normalized_record,is_valid,validation_errors)
      values(org_id,new_run,row_no::integer,'roster',stored_item,jsonb_build_object('display_ref',masked_ref,'site_id',default_site_id,'cohort_id',cohort_id),true,'{}'::text[]);

      insert into public.participant_roster_entries(organization_id,site_id,external_ref_hash,display_ref,status,source_run_id)
      values(org_id,default_site_id,ref_hash,masked_ref,'active',new_run)
      on conflict (organization_id,external_ref_hash) do update
        set site_id=coalesce(excluded.site_id,public.participant_roster_entries.site_id),
            display_ref=excluded.display_ref,
            status=case when public.participant_roster_entries.status='withdrawn' then 'withdrawn' else 'active' end,
            source_run_id=excluded.source_run_id,
            updated_at=now()
      returning id into roster_id;

      if (select status from public.participant_roster_entries where id=roster_id) <> 'withdrawn' then
        insert into public.roster_cohort_memberships(organization_id,roster_entry_id,cohort_id,source_run_id,status)
        values(org_id,roster_id,cohort_id,new_run,'active')
        on conflict (roster_entry_id,cohort_id) do update set status='active',source_run_id=excluded.source_run_id;
      end if;
      valid_count := valid_count + 1;
    else
      insert into public.ingestion_rows(organization_id,ingestion_run_id,row_number,record_type,raw_record,normalized_record,is_valid,validation_errors)
      values(org_id,new_run,row_no::integer,'roster',stored_item,'{}'::jsonb,false,errors);
      invalid_count := invalid_count + 1;
    end if;
  end loop;

  final_status := case when invalid_count=0 then 'completed' else 'completed_with_errors' end;
  update public.ingestion_runs set status=final_status,row_count=total_count,valid_row_count=valid_count,invalid_row_count=invalid_count,completed_at=now() where id=new_run;
  if source_id is not null then
    update public.data_sources set status=case when invalid_count=0 then 'healthy' else 'partial' end,last_synced_at=now(),coverage_summary=format('%s roster rows accepted; %s rows require review',valid_count,invalid_count) where id=source_id and organization_id=org_id;
  end if;
  if invalid_count > 0 then
    insert into public.operational_tasks(organization_id,category,priority,title,detail,subject_type,subject_id,created_by)
    values(org_id,'ingestion_validation','high','Review cohort roster import',format('%s of %s roster rows require correction or exclusion.',invalid_count,total_count),'ingestion_run',new_run::text,uid);
  end if;
  run_id:=new_run; row_count:=total_count; valid_row_count:=valid_count; invalid_row_count:=invalid_count; status:=final_status; return next;
end;
$$;

create or replace function public.import_commute_records(
  org_id uuid,
  source_id uuid,
  file_name text,
  content_sha256 text,
  rows jsonb,
  default_site_id uuid default null,
  default_cohort_id uuid default null
)
returns table(run_id uuid, row_count integer, valid_row_count integer, invalid_row_count integer, status text)
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  new_run uuid;
  item jsonb;
  stored_item jsonb;
  row_no bigint;
  errors text[];
  raw_ref text;
  ref_hash text;
  masked_ref text;
  roster_id uuid;
  source_row uuid;
  origin_value text;
  destination_value text;
  days smallint[];
  flex_value integer;
  parking_value smallint;
  access_value boolean;
  ev_value text;
  arrival_start_value time;
  arrival_end_value time;
  return_start_value time;
  return_end_value time;
  valid_count integer := 0;
  invalid_count integer := 0;
  total_count integer := 0;
  final_status text;
  day_json_count integer;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if not private.can_manage_org(org_id) then raise exception 'Organization management permission required'; end if;
  if jsonb_typeof(rows) <> 'array' then raise exception 'Rows must be a JSON array'; end if;
  if coalesce(trim(file_name),'') = '' then raise exception 'File name required'; end if;
  if coalesce(content_sha256,'') !~ '^[0-9a-fA-F]{64}$' then raise exception 'SHA-256 content hash required'; end if;
  if source_id is not null and not exists(select 1 from public.data_sources d where d.id=source_id and d.organization_id=org_id) then raise exception 'Data source does not belong to organization'; end if;
  if default_site_id is not null and not exists(select 1 from public.organization_sites s where s.id=default_site_id and s.organization_id=org_id) then raise exception 'Site does not belong to organization'; end if;
  if default_cohort_id is not null and not exists(select 1 from public.cohorts c where c.id=default_cohort_id and c.organization_id=org_id) then raise exception 'Cohort does not belong to organization'; end if;

  insert into public.ingestion_runs(organization_id,data_source_id,import_type,file_name,content_sha256,created_by)
  values(org_id,source_id,'commute_csv',trim(file_name),lower(content_sha256),uid)
  returning id into new_run;

  for item,row_no in select value,ordinality from jsonb_array_elements(rows) with ordinality loop
    total_count := total_count + 1;
    errors := '{}'::text[];
    raw_ref := trim(coalesce(item->>'participant_ref',''));
    stored_item := item - 'participant_ref' - 'employee_id' - 'student_id' - 'id';
    origin_value := trim(coalesce(item->>'origin_zone',''));
    destination_value := trim(coalesce(item->>'destination_zone',''));
    flex_value := 0; parking_value := null; access_value := false;
    ev_value := lower(coalesce(nullif(trim(item->>'ev_hybrid_status'),''),'unknown'));
    days := '{}'::smallint[];
    arrival_start_value := null; arrival_end_value := null; return_start_value := null; return_end_value := null;

    if raw_ref='' then errors:=array_append(errors,'participant_ref is required'); end if;
    if char_length(raw_ref)>160 then errors:=array_append(errors,'participant_ref exceeds 160 characters'); end if;
    if origin_value='' then errors:=array_append(errors,'origin_zone is required'); end if;
    if destination_value='' then errors:=array_append(errors,'destination_zone is required'); end if;
    if origin_value ~* '^[0-9]{1,6}[[:space:]].*(street|st\.?|avenue|ave\.?|boulevard|blvd\.?|road|rd\.?|drive|dr\.?|lane|ln\.?)([[:space:]]|$)' then errors:=array_append(errors,'origin_zone appears to contain an exact street address; use an approximate zone'); end if;
    if destination_value ~* '^[0-9]{1,6}[[:space:]].*(street|st\.?|avenue|ave\.?|boulevard|blvd\.?|road|rd\.?|drive|dr\.?|lane|ln\.?)([[:space:]]|$)' then errors:=array_append(errors,'destination_zone appears to contain an exact street address; use an approximate zone'); end if;
    if lower(coalesce(item->>'approximate_zones','false')) not in ('true','1','yes') then errors:=array_append(errors,'approximate_zones acknowledgement is required'); end if;

    if jsonb_typeof(item->'travel_days')='array' then
      day_json_count := jsonb_array_length(item->'travel_days');
      begin
        select coalesce(array_agg(v::smallint order by v::smallint),'{}'::smallint[]) into days from jsonb_array_elements_text(item->'travel_days') v where v ~ '^[0-6]$';
      exception when others then days := '{}'::smallint[]; end;
      if day_json_count=0 or cardinality(days)<>day_json_count then errors:=array_append(errors,'travel_days must contain values 0 through 6'); end if;
    else errors:=array_append(errors,'travel_days must be an array'); end if;

    if coalesce(item->>'flexibility_minutes','')<>'' then
      if (item->>'flexibility_minutes') ~ '^[0-9]{1,3}$' then flex_value := (item->>'flexibility_minutes')::integer; if flex_value>240 then errors:=array_append(errors,'flexibility_minutes must be between 0 and 240'); end if;
      else errors:=array_append(errors,'flexibility_minutes must be a whole number'); end if;
    end if;
    if coalesce(item->>'parking_difficulty','')<>'' then
      if (item->>'parking_difficulty') ~ '^[1-5]$' then parking_value:=(item->>'parking_difficulty')::smallint; else errors:=array_append(errors,'parking_difficulty must be 1 through 5'); end if;
    end if;
    case lower(coalesce(item->>'access_point_willing','false')) when 'true' then access_value:=true; when '1' then access_value:=true; when 'yes' then access_value:=true; when 'false' then access_value:=false; when '0' then access_value:=false; when 'no' then access_value:=false; else errors:=array_append(errors,'access_point_willing must be true or false'); end case;
    if ev_value not in ('ev','hybrid','plug_in_hybrid','ice','unknown','prefer_ev_hybrid') then errors:=array_append(errors,'unsupported ev_hybrid_status'); end if;
    begin
      if coalesce(item->>'arrival_start','')<>'' then arrival_start_value:=(item->>'arrival_start')::time; end if;
      if coalesce(item->>'arrival_end','')<>'' then arrival_end_value:=(item->>'arrival_end')::time; end if;
      if coalesce(item->>'return_start','')<>'' then return_start_value:=(item->>'return_start')::time; end if;
      if coalesce(item->>'return_end','')<>'' then return_end_value:=(item->>'return_end')::time; end if;
      if arrival_start_value is not null and arrival_end_value is not null and arrival_end_value < arrival_start_value then errors:=array_append(errors,'arrival_end must not be earlier than arrival_start'); end if;
      if return_start_value is not null and return_end_value is not null and return_end_value < return_start_value then errors:=array_append(errors,'return_end must not be earlier than return_start'); end if;
    exception when others then errors:=array_append(errors,'time fields must use HH:MM format'); end;

    if cardinality(errors)=0 then
      ref_hash:=encode(digest(raw_ref,'sha256'),'hex'); masked_ref:=case when char_length(raw_ref)<=4 then '…'||right(raw_ref,1) else '…'||right(raw_ref,4) end;
      insert into public.ingestion_rows(organization_id,ingestion_run_id,row_number,record_type,raw_record,normalized_record,is_valid,validation_errors)
      values(org_id,new_run,row_no::integer,'commute',stored_item,jsonb_build_object('display_ref',masked_ref,'origin_zone',origin_value,'destination_zone',destination_value,'travel_days',to_jsonb(days),'arrival_start',arrival_start_value,'arrival_end',arrival_end_value,'return_start',return_start_value,'return_end',return_end_value,'flexibility_minutes',flex_value,'current_mode',nullif(trim(item->>'current_mode'),''),'parking_difficulty',parking_value,'access_point_willing',access_value,'ev_hybrid_status',ev_value,'site_id',default_site_id,'cohort_id',default_cohort_id,'approximate_zones',true),true,'{}'::text[]) returning id into source_row;
      insert into public.participant_roster_entries(organization_id,site_id,external_ref_hash,display_ref,status,source_run_id)
      values(org_id,default_site_id,ref_hash,masked_ref,'active',new_run)
      on conflict (organization_id,external_ref_hash) do update set site_id=coalesce(excluded.site_id,public.participant_roster_entries.site_id),display_ref=excluded.display_ref,status=case when public.participant_roster_entries.status='withdrawn' then 'withdrawn' else 'active' end,source_run_id=excluded.source_run_id,updated_at=now()
      returning id into roster_id;
      if default_cohort_id is not null and (select status from public.participant_roster_entries where id=roster_id)<>'withdrawn' then
        insert into public.roster_cohort_memberships(organization_id,roster_entry_id,cohort_id,source_run_id,status) values(org_id,roster_id,default_cohort_id,new_run,'active') on conflict (roster_entry_id,cohort_id) do update set status='active',source_run_id=excluded.source_run_id;
      end if;
      if (select status from public.participant_roster_entries where id=roster_id)<>'withdrawn' then
        insert into public.commute_observations(organization_id,site_id,cohort_id,roster_entry_id,source_run_id,source_row_id,origin_zone,destination_zone,travel_days,arrival_start,arrival_end,return_start,return_end,flexibility_minutes,current_mode,parking_difficulty,access_point_willing,ev_hybrid_status,approximate_zones,status)
        values(org_id,default_site_id,default_cohort_id,roster_id,new_run,source_row,origin_value,destination_value,days,arrival_start_value,arrival_end_value,return_start_value,return_end_value,flex_value,nullif(trim(item->>'current_mode'),''),parking_value,access_value,ev_value,true,'active');
      end if;
      valid_count:=valid_count+1;
    else
      insert into public.ingestion_rows(organization_id,ingestion_run_id,row_number,record_type,raw_record,normalized_record,is_valid,validation_errors) values(org_id,new_run,row_no::integer,'commute',stored_item,'{}'::jsonb,false,errors);
      invalid_count:=invalid_count+1;
    end if;
  end loop;

  final_status:=case when invalid_count=0 then 'completed' else 'completed_with_errors' end;
  update public.ingestion_runs set status=final_status,row_count=total_count,valid_row_count=valid_count,invalid_row_count=invalid_count,completed_at=now() where id=new_run;
  if source_id is not null then update public.data_sources set status=case when invalid_count=0 then 'healthy' else 'partial' end,last_synced_at=now(),coverage_summary=format('%s commute rows accepted; %s rows require review',valid_count,invalid_count) where id=source_id and organization_id=org_id; end if;
  if invalid_count>0 then insert into public.operational_tasks(organization_id,category,priority,title,detail,subject_type,subject_id,created_by) values(org_id,'ingestion_validation','high','Review commute CSV validation',format('%s of %s commute rows require correction or exclusion.',invalid_count,total_count),'ingestion_run',new_run::text,uid); end if;
  run_id:=new_run; row_count:=total_count; valid_row_count:=valid_count; invalid_row_count:=invalid_count; status:=final_status; return next;
end;
$$;
