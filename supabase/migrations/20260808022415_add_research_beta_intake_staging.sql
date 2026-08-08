create extension if not exists pgcrypto;

create table if not exists public.research_beta_intake (
  id uuid primary key default gen_random_uuid(),
  participant_ref text not null unique default ('RR-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8))),
  token_hash text not null,
  submission_type text not null check (submission_type in ('commute_need', 'planned_route')),
  status text not null default 'submitted' check (status in ('submitted', 'withdrawn')),
  consent_version text not null,
  consented_at timestamptz not null default now(),
  age_18_plus boolean not null check (age_18_plus = true),
  origin_zone text not null check (char_length(origin_zone) between 2 and 160),
  destination_zone text not null check (char_length(destination_zone) between 2 and 160),
  days text[] not null check (
    cardinality(days) > 0
    and days <@ array['Mon','Tue','Wed','Thu','Fri','Sat','Sun']::text[]
  ),
  arrival_start time not null,
  arrival_end time not null,
  return_start time,
  return_end time,
  flexibility_minutes integer check (flexibility_minutes between 0 and 120),
  current_mode text,
  parking_difficulty text,
  access_point_willing boolean not null default false,
  preferred_access_point text,
  transit_preference text,
  ev_preference text,
  accessibility_notes text check (accessibility_notes is null or char_length(accessibility_notes) <= 1000),
  contribution_band text,
  capacity integer check (capacity is null or capacity between 1 and 8),
  max_detour_minutes integer check (max_detour_minutes is null or max_detour_minutes between 0 and 60),
  planned_route_note text check (planned_route_note is null or char_length(planned_route_note) <= 1000),
  approximate_zones boolean not null default true check (approximate_zones = true),
  masked_contact boolean not null default true check (masked_contact = true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  check (arrival_end >= arrival_start),
  check ((return_start is null and return_end is null) or (return_start is not null and return_end is not null)),
  check (return_start is null or return_end >= return_start),
  check (submission_type <> 'planned_route' or nullif(btrim(planned_route_note), '') is not null)
);

comment on table public.research_beta_intake is
  'Staging records for anonymous Relay Rider research-beta intake. These are not canonical participant, commuter_need, or planned_route records and must not be treated as confirmed transportation activity.';

create index if not exists research_beta_intake_token_hash_idx on public.research_beta_intake(token_hash);
create index if not exists research_beta_intake_status_created_idx on public.research_beta_intake(status, created_at desc);

alter table public.research_beta_intake enable row level security;
alter table public.research_beta_intake force row level security;
revoke all on table public.research_beta_intake from anon, authenticated;

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
    'withdrawnAt', r.withdrawn_at
  );
$$;

create or replace function public.save_research_submission(
  p_token text,
  p_submission_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions, pg_temp
as $$
declare
  v_row public.research_beta_intake;
  v_token_hash text;
  v_days text[];
begin
  if p_token is null or char_length(p_token) < 32 then
    raise exception 'Invalid participant token';
  end if;
  if p_payload is null then
    raise exception 'Missing submission payload';
  end if;
  if coalesce((p_payload->>'age18Plus')::boolean, false) is not true then
    raise exception 'Adult eligibility acknowledgement is required';
  end if;
  if nullif(btrim(p_payload->>'consentVersion'), '') is null then
    raise exception 'Consent version is required';
  end if;

  v_token_hash := encode(digest(p_token, 'sha256'), 'hex');
  v_days := array(select jsonb_array_elements_text(coalesce(p_payload->'days', '[]'::jsonb)));

  if p_submission_id is null then
    insert into public.research_beta_intake (
      token_hash, submission_type, consent_version, age_18_plus,
      origin_zone, destination_zone, days,
      arrival_start, arrival_end, return_start, return_end,
      flexibility_minutes, current_mode, parking_difficulty,
      access_point_willing, preferred_access_point,
      transit_preference, ev_preference, accessibility_notes,
      contribution_band, capacity, max_detour_minutes, planned_route_note,
      approximate_zones, masked_contact
    ) values (
      v_token_hash,
      p_payload->>'submissionType',
      p_payload->>'consentVersion',
      (p_payload->>'age18Plus')::boolean,
      btrim(p_payload->>'originZone'),
      btrim(p_payload->>'destinationZone'),
      v_days,
      (p_payload->>'arrivalStart')::time,
      (p_payload->>'arrivalEnd')::time,
      nullif(p_payload->>'returnStart', '')::time,
      nullif(p_payload->>'returnEnd', '')::time,
      nullif(p_payload->>'flexibilityMinutes', '')::integer,
      nullif(p_payload->>'currentMode', ''),
      nullif(p_payload->>'parkingDifficulty', ''),
      coalesce((p_payload->>'accessPointWilling')::boolean, false),
      nullif(p_payload->>'preferredAccessPoint', ''),
      nullif(p_payload->>'transitPreference', ''),
      nullif(p_payload->>'evPreference', ''),
      nullif(btrim(p_payload->>'accessibilityNotes'), ''),
      nullif(p_payload->>'contributionBand', ''),
      nullif(p_payload->>'capacity', '')::integer,
      nullif(p_payload->>'maxDetourMinutes', '')::integer,
      nullif(btrim(p_payload->>'plannedRouteNote'), ''),
      true,
      true
    ) returning * into v_row;
  else
    update public.research_beta_intake
    set
      submission_type = p_payload->>'submissionType',
      consent_version = p_payload->>'consentVersion',
      consented_at = now(),
      age_18_plus = (p_payload->>'age18Plus')::boolean,
      origin_zone = btrim(p_payload->>'originZone'),
      destination_zone = btrim(p_payload->>'destinationZone'),
      days = v_days,
      arrival_start = (p_payload->>'arrivalStart')::time,
      arrival_end = (p_payload->>'arrivalEnd')::time,
      return_start = nullif(p_payload->>'returnStart', '')::time,
      return_end = nullif(p_payload->>'returnEnd', '')::time,
      flexibility_minutes = nullif(p_payload->>'flexibilityMinutes', '')::integer,
      current_mode = nullif(p_payload->>'currentMode', ''),
      parking_difficulty = nullif(p_payload->>'parkingDifficulty', ''),
      access_point_willing = coalesce((p_payload->>'accessPointWilling')::boolean, false),
      preferred_access_point = nullif(p_payload->>'preferredAccessPoint', ''),
      transit_preference = nullif(p_payload->>'transitPreference', ''),
      ev_preference = nullif(p_payload->>'evPreference', ''),
      accessibility_notes = nullif(btrim(p_payload->>'accessibilityNotes'), ''),
      contribution_band = nullif(p_payload->>'contributionBand', ''),
      capacity = nullif(p_payload->>'capacity', '')::integer,
      max_detour_minutes = nullif(p_payload->>'maxDetourMinutes', '')::integer,
      planned_route_note = nullif(btrim(p_payload->>'plannedRouteNote'), ''),
      approximate_zones = true,
      masked_contact = true,
      updated_at = now()
    where id = p_submission_id
      and token_hash = v_token_hash
      and status = 'submitted'
    returning * into v_row;

    if v_row.id is null then
      raise exception 'Submission not found or access denied';
    end if;
  end if;

  return private.research_beta_intake_json(v_row);
end;
$$;

create or replace function public.get_research_submission(
  p_token text,
  p_submission_id uuid
)
returns jsonb
language plpgsql
security definer
stable
set search_path = public, private, extensions, pg_temp
as $$
declare
  v_row public.research_beta_intake;
begin
  if p_token is null or char_length(p_token) < 32 or p_submission_id is null then
    return null;
  end if;

  select * into v_row
  from public.research_beta_intake
  where id = p_submission_id
    and token_hash = encode(digest(p_token, 'sha256'), 'hex')
  limit 1;

  if v_row.id is null then
    return null;
  end if;

  return private.research_beta_intake_json(v_row);
end;
$$;

create or replace function public.withdraw_research_submission(
  p_token text,
  p_submission_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions, pg_temp
as $$
declare
  v_count integer;
begin
  if p_token is null or char_length(p_token) < 32 or p_submission_id is null then
    return jsonb_build_object('withdrawn', false);
  end if;

  update public.research_beta_intake
  set status = 'withdrawn', withdrawn_at = now(), updated_at = now()
  where id = p_submission_id
    and token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and status = 'submitted';

  get diagnostics v_count = row_count;
  return jsonb_build_object('withdrawn', v_count = 1);
end;
$$;

revoke all on function public.save_research_submission(text, uuid, jsonb) from public;
revoke all on function public.get_research_submission(text, uuid) from public;
revoke all on function public.withdraw_research_submission(text, uuid) from public;
grant execute on function public.save_research_submission(text, uuid, jsonb) to anon, authenticated;
grant execute on function public.get_research_submission(text, uuid) to anon, authenticated;
grant execute on function public.withdraw_research_submission(text, uuid) to anon, authenticated;
