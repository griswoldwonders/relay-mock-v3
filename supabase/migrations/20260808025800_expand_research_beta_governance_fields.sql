alter table public.research_beta_intake
  add column if not exists institution_context text,
  add column if not exists cohort_context text,
  add column if not exists privacy_preference text,
  add column if not exists verification_willing boolean not null default false,
  add column if not exists accessibility_capability text,
  add column if not exists contribution_review_range text;

create or replace function private.research_beta_intake_json(r public.research_beta_intake)
returns jsonb
language sql
stable
set search_path to 'public', 'private', 'pg_temp'
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
    'institutionContext', coalesce(r.institution_context, ''),
    'cohortContext', coalesce(r.cohort_context, ''),
    'privacyPreference', coalesce(r.privacy_preference, ''),
    'verificationWilling', r.verification_willing,
    'accessibilityCapability', coalesce(r.accessibility_capability, ''),
    'contributionReviewRange', coalesce(r.contribution_review_range, ''),
    'approximateZones', r.approximate_zones,
    'maskedContact', r.masked_contact,
    'createdAt', r.created_at,
    'updatedAt', r.updated_at,
    'withdrawnAt', r.withdrawn_at,
    'retentionExpiresAt', r.retention_expires_at
  );
$$;

create or replace function public.save_research_submission(p_token text, p_submission_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private', 'extensions', 'pg_temp'
as $$
declare
  v_row public.research_beta_intake;
  v_token_hash text;
  v_days text[];
begin
  if p_token is null or char_length(p_token) < 32 then raise exception 'Invalid participant token'; end if;
  if p_payload is null then raise exception 'Missing submission payload'; end if;
  if coalesce((p_payload->>'age18Plus')::boolean, false) is not true then raise exception 'Adult eligibility acknowledgement is required'; end if;
  if coalesce((p_payload->>'dataConsent')::boolean, false) is not true then raise exception 'Data-use consent is required'; end if;
  if coalesce((p_payload->>'prototypeAcknowledged')::boolean, false) is not true then raise exception 'Research-beta acknowledgement is required'; end if;
  if nullif(btrim(p_payload->>'consentVersion'), '') is null then raise exception 'Consent version is required'; end if;

  v_token_hash := encode(digest(p_token, 'sha256'), 'hex');
  v_days := array(select jsonb_array_elements_text(coalesce(p_payload->'days', '[]'::jsonb)));

  if p_submission_id is null then
    insert into public.research_beta_intake (
      token_hash, submission_type, consent_version, age_18_plus, data_consent, prototype_acknowledged,
      origin_zone, destination_zone, days, arrival_start, arrival_end, return_start, return_end,
      flexibility_minutes, current_mode, parking_difficulty, access_point_willing, preferred_access_point,
      transit_preference, ev_preference, accessibility_notes, contribution_band, capacity, max_detour_minutes,
      planned_route_note, institution_context, cohort_context, privacy_preference, verification_willing,
      accessibility_capability, contribution_review_range, approximate_zones, masked_contact
    ) values (
      v_token_hash, p_payload->>'submissionType', p_payload->>'consentVersion',
      (p_payload->>'age18Plus')::boolean, (p_payload->>'dataConsent')::boolean, (p_payload->>'prototypeAcknowledged')::boolean,
      btrim(p_payload->>'originZone'), btrim(p_payload->>'destinationZone'), v_days,
      (p_payload->>'arrivalStart')::time, (p_payload->>'arrivalEnd')::time,
      nullif(p_payload->>'returnStart', '')::time, nullif(p_payload->>'returnEnd', '')::time,
      nullif(p_payload->>'flexibilityMinutes', '')::integer, nullif(p_payload->>'currentMode', ''),
      nullif(p_payload->>'parkingDifficulty', ''), coalesce((p_payload->>'accessPointWilling')::boolean, false),
      nullif(p_payload->>'preferredAccessPoint', ''), nullif(p_payload->>'transitPreference', ''),
      nullif(p_payload->>'evPreference', ''), nullif(btrim(p_payload->>'accessibilityNotes'), ''),
      nullif(p_payload->>'contributionBand', ''), nullif(p_payload->>'capacity', '')::integer,
      nullif(p_payload->>'maxDetourMinutes', '')::integer, nullif(btrim(p_payload->>'plannedRouteNote'), ''),
      nullif(p_payload->>'institutionContext', ''), nullif(p_payload->>'cohortContext', ''),
      nullif(p_payload->>'privacyPreference', ''), coalesce((p_payload->>'verificationWilling')::boolean, false),
      nullif(p_payload->>'accessibilityCapability', ''), nullif(p_payload->>'contributionReviewRange', ''), true, true
    ) returning * into v_row;
  else
    update public.research_beta_intake set
      submission_type = p_payload->>'submissionType', consent_version = p_payload->>'consentVersion', consented_at = now(),
      age_18_plus = (p_payload->>'age18Plus')::boolean, data_consent = (p_payload->>'dataConsent')::boolean,
      prototype_acknowledged = (p_payload->>'prototypeAcknowledged')::boolean,
      origin_zone = btrim(p_payload->>'originZone'), destination_zone = btrim(p_payload->>'destinationZone'), days = v_days,
      arrival_start = (p_payload->>'arrivalStart')::time, arrival_end = (p_payload->>'arrivalEnd')::time,
      return_start = nullif(p_payload->>'returnStart', '')::time, return_end = nullif(p_payload->>'returnEnd', '')::time,
      flexibility_minutes = nullif(p_payload->>'flexibilityMinutes', '')::integer, current_mode = nullif(p_payload->>'currentMode', ''),
      parking_difficulty = nullif(p_payload->>'parkingDifficulty', ''),
      access_point_willing = coalesce((p_payload->>'accessPointWilling')::boolean, false), preferred_access_point = nullif(p_payload->>'preferredAccessPoint', ''),
      transit_preference = nullif(p_payload->>'transitPreference', ''), ev_preference = nullif(p_payload->>'evPreference', ''),
      accessibility_notes = nullif(btrim(p_payload->>'accessibilityNotes'), ''), contribution_band = nullif(p_payload->>'contributionBand', ''),
      capacity = nullif(p_payload->>'capacity', '')::integer, max_detour_minutes = nullif(p_payload->>'maxDetourMinutes', '')::integer,
      planned_route_note = nullif(btrim(p_payload->>'plannedRouteNote'), ''), institution_context = nullif(p_payload->>'institutionContext', ''),
      cohort_context = nullif(p_payload->>'cohortContext', ''), privacy_preference = nullif(p_payload->>'privacyPreference', ''),
      verification_willing = coalesce((p_payload->>'verificationWilling')::boolean, false),
      accessibility_capability = nullif(p_payload->>'accessibilityCapability', ''), contribution_review_range = nullif(p_payload->>'contributionReviewRange', ''),
      approximate_zones = true, masked_contact = true, updated_at = now()
    where id = p_submission_id and token_hash = v_token_hash and status = 'submitted'
    returning * into v_row;

    if v_row.id is null then raise exception 'Submission not found or access denied'; end if;
  end if;

  return private.research_beta_intake_json(v_row);
end;
$$;

revoke all on function public.save_research_submission(text,uuid,jsonb) from public;
grant execute on function public.save_research_submission(text,uuid,jsonb) to anon;
