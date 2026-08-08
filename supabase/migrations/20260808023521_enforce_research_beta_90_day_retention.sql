create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

alter table public.research_beta_intake
  add column if not exists retention_expires_at timestamptz;

update public.research_beta_intake
set retention_expires_at = created_at + interval '90 days'
where retention_expires_at is null;

alter table public.research_beta_intake
  alter column retention_expires_at set default (now() + interval '90 days'),
  alter column retention_expires_at set not null;

create or replace function private.research_beta_intake_json(r public.research_beta_intake)
returns jsonb
language sql
stable
set search_path = public, private, pg_temp
as $$
  select jsonb_build_object(
    'id', r.id,
    'participantRef', r.participant_ref,
    'status', r.status,
    'submissionType', r.submission_type,
    'consentVersion', r.consent_version,
    'age18Plus', r.age_18_plus,
    'dataConsent', r.data_consent,
    'prototypeAcknowledged', r.prototype_acknowledged,
    'originZone', r.origin_zone,
    'destinationZone', r.destination_zone,
    'days', r.days,
    'arrivalStart', to_char(r.arrival_start, 'HH24:MI'),
    'arrivalEnd', to_char(r.arrival_end, 'HH24:MI'),
    'returnStart', case when r.return_start is null then '' else to_char(r.return_start, 'HH24:MI') end,
    'returnEnd', case when r.return_end is null then '' else to_char(r.return_end, 'HH24:MI') end,
    'flexibilityMinutes', r.flexibility_minutes,
    'currentMode', coalesce(r.current_mode, ''),
    'parkingDifficulty', coalesce(r.parking_difficulty, ''),
    'accessPointWilling', r.access_point_willing,
    'preferredAccessPoint', coalesce(r.preferred_access_point, ''),
    'transitPreference', coalesce(r.transit_preference, ''),
    'evPreference', coalesce(r.ev_preference, ''),
    'accessibilityNotes', coalesce(r.accessibility_notes, ''),
    'contributionBand', coalesce(r.contribution_band, ''),
    'capacity', r.capacity,
    'maxDetourMinutes', r.max_detour_minutes,
    'plannedRouteNote', coalesce(r.planned_route_note, ''),
    'approximateZones', r.approximate_zones,
    'maskedContact', r.masked_contact,
    'createdAt', r.created_at,
    'updatedAt', r.updated_at,
    'withdrawnAt', r.withdrawn_at,
    'retentionExpiresAt', r.retention_expires_at
  );
$$;

create or replace function private.purge_expired_research_beta_intake()
returns integer
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_count integer;
begin
  delete from public.research_beta_intake
  where retention_expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function private.purge_expired_research_beta_intake() from public, anon, authenticated;
grant execute on function private.purge_expired_research_beta_intake() to postgres, service_role;

do $$
declare
  v_jobid bigint;
begin
  select jobid into v_jobid
  from cron.job
  where jobname = 'purge_research_beta_intake_90d'
  limit 1;

  if v_jobid is not null then
    perform cron.unschedule(v_jobid);
  end if;
end;
$$;

select cron.schedule(
  'purge_research_beta_intake_90d',
  '17 3 * * *',
  $$select private.purge_expired_research_beta_intake();$$
);
