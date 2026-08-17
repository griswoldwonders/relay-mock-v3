-- Relay Rider participant client contract v1.
-- Provides a narrow, tenant-scoped API for the commuter application without
-- duplicating the institutional backend or exposing other participants' data.

-- Tighten direct participant writes so an authenticated user cannot attach a
-- commuter need or planned route to an organization they do not belong to.
drop policy if exists commuter_needs_owner_insert on public.commuter_needs;
drop policy if exists commuter_needs_owner_update on public.commuter_needs;
create policy commuter_needs_owner_insert on public.commuter_needs
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (organization_id is null or private.is_org_member(organization_id))
  and (
    cohort_id is null
    or exists (
      select 1
      from public.cohort_members cm
      where cm.cohort_id = commuter_needs.cohort_id
        and cm.organization_id = commuter_needs.organization_id
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
    )
  )
);
create policy commuter_needs_owner_update on public.commuter_needs
for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (organization_id is null or private.is_org_member(organization_id))
  and (
    cohort_id is null
    or exists (
      select 1
      from public.cohort_members cm
      where cm.cohort_id = commuter_needs.cohort_id
        and cm.organization_id = commuter_needs.organization_id
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
    )
  )
);

drop policy if exists planned_routes_owner_insert on public.planned_routes;
drop policy if exists planned_routes_owner_update on public.planned_routes;
create policy planned_routes_owner_insert on public.planned_routes
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (organization_id is null or private.is_org_member(organization_id))
  and (
    cohort_id is null
    or exists (
      select 1
      from public.cohort_members cm
      where cm.cohort_id = planned_routes.cohort_id
        and cm.organization_id = planned_routes.organization_id
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
    )
  )
);
create policy planned_routes_owner_update on public.planned_routes
for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (organization_id is null or private.is_org_member(organization_id))
  and (
    cohort_id is null
    or exists (
      select 1
      from public.cohort_members cm
      where cm.cohort_id = planned_routes.cohort_id
        and cm.organization_id = planned_routes.organization_id
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
    )
  )
);

grant select, insert, update, delete on table public.commuter_needs to authenticated;
grant select, insert, update, delete on table public.planned_routes to authenticated;
grant select on table public.access_points to authenticated;
grant select on table public.match_previews to authenticated;
grant select on table public.administrative_reviews to authenticated;

-- Participant-safe program context. Invitation acceptance remains the only
-- supported self-service route into an institution; this function only reads
-- memberships already granted by the institution.
create or replace function public.get_participant_program_context()
returns table(
  organization_id uuid,
  organization_name text,
  organization_type text,
  organization_status text,
  member_role text,
  member_status text,
  site_id uuid,
  site_name text,
  cohort_id uuid,
  cohort_name text
)
language sql
stable
security definer
set search_path = public, private, pg_catalog
as $$
  select
    om.organization_id,
    o.name,
    o.organization_type,
    o.status,
    om.role,
    om.status,
    oms.site_id,
    s.name,
    cm.cohort_id,
    c.name
  from public.organization_members om
  join public.organizations o on o.id = om.organization_id
  left join public.organization_member_sites oms
    on oms.organization_id = om.organization_id
   and oms.user_id = om.user_id
  left join public.organization_sites s
    on s.id = oms.site_id
   and s.organization_id = om.organization_id
  left join public.cohort_members cm
    on cm.organization_id = om.organization_id
   and cm.user_id = om.user_id
   and cm.status = 'active'
  left join public.cohorts c
    on c.id = cm.cohort_id
   and c.organization_id = om.organization_id
  where om.user_id = (select auth.uid())
    and om.status = 'active'
  order by o.name, s.name nulls last, c.name nulls last;
$$;
revoke all on function public.get_participant_program_context() from public, anon;
grant execute on function public.get_participant_program_context() to authenticated;

-- Stable write contract for the commuter application's commute-need flow.
-- window_start/window_end are the v1 generic schedule window and are stored in
-- the existing earliest_departure/latest_departure columns used by the current
-- deterministic compatibility engine.
create or replace function public.submit_participant_commuter_need(
  org_id uuid,
  cohort_id uuid,
  origin_zone text,
  destination_zone text,
  travel_days smallint[],
  window_start time,
  window_end time,
  flexibility_minutes integer default 0,
  access_point_willingness boolean default true,
  ev_hybrid_preference text default 'no_preference',
  accessibility_preferences jsonb default '{}'::jsonb,
  privacy_setting text default 'zone_only'
)
returns uuid
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  new_id uuid;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if org_id is null or not private.is_org_member(org_id) then
    raise exception 'Active institutional membership required';
  end if;
  if cohort_id is not null and not exists (
    select 1 from public.cohort_members cm
    where cm.organization_id = org_id
      and cm.cohort_id = submit_participant_commuter_need.cohort_id
      and cm.user_id = uid
      and cm.status = 'active'
  ) then
    raise exception 'Participant is not an active member of the selected cohort';
  end if;
  if char_length(trim(coalesce(origin_zone,''))) < 2 or char_length(trim(coalesce(destination_zone,''))) < 2 then
    raise exception 'Approximate origin and destination zones are required';
  end if;

  insert into public.commuter_needs(
    user_id, organization_id, cohort_id, origin_zone, destination_zone,
    travel_days, earliest_departure, latest_departure, flexibility_minutes,
    access_point_willingness, preferred_access_point_ids,
    ev_hybrid_preference, accessibility_preferences, privacy_setting, status
  ) values (
    uid, org_id, cohort_id, trim(origin_zone), trim(destination_zone),
    coalesce(travel_days,'{}'::smallint[]), window_start, window_end,
    greatest(0, least(coalesce(flexibility_minutes,0), 240)),
    coalesce(access_point_willingness,true), '{}'::uuid[],
    coalesce(ev_hybrid_preference,'no_preference'),
    coalesce(accessibility_preferences,'{}'::jsonb),
    coalesce(privacy_setting,'zone_only'), 'active'
  ) returning id into new_id;

  return new_id;
end;
$$;
revoke all on function public.submit_participant_commuter_need(uuid,uuid,text,text,smallint[],time,time,integer,boolean,text,jsonb,text) from public, anon;
grant execute on function public.submit_participant_commuter_need(uuid,uuid,text,text,smallint[],time,time,integer,boolean,text,jsonb,text) to authenticated;

-- Stable write contract for an EV/hybrid participant registering an existing
-- planned route. This does not activate transportation or create compensation.
create or replace function public.submit_participant_planned_route(
  org_id uuid,
  cohort_id uuid,
  origin_zone text,
  destination_zone text,
  travel_days smallint[],
  window_start time,
  window_end time,
  available_capacity integer default 1,
  maximum_detour_minutes integer default 10,
  vehicle_type text default 'unspecified',
  vehicle_details jsonb default '{}'::jsonb,
  verification_willingness boolean default false,
  privacy_setting text default 'zone_only'
)
returns uuid
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  new_id uuid;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if org_id is null or not private.is_org_member(org_id) then
    raise exception 'Active institutional membership required';
  end if;
  if cohort_id is not null and not exists (
    select 1 from public.cohort_members cm
    where cm.organization_id = org_id
      and cm.cohort_id = submit_participant_planned_route.cohort_id
      and cm.user_id = uid
      and cm.status = 'active'
  ) then
    raise exception 'Participant is not an active member of the selected cohort';
  end if;
  if char_length(trim(coalesce(origin_zone,''))) < 2 or char_length(trim(coalesce(destination_zone,''))) < 2 then
    raise exception 'Approximate origin and destination zones are required';
  end if;

  insert into public.planned_routes(
    user_id, organization_id, cohort_id, origin_zone, destination_zone,
    travel_days, earliest_departure, latest_departure, available_capacity,
    maximum_detour_minutes, preferred_access_point_ids, vehicle_type,
    vehicle_details, privacy_setting, verification_willingness,
    verification_status, status
  ) values (
    uid, org_id, cohort_id, trim(origin_zone), trim(destination_zone),
    coalesce(travel_days,'{}'::smallint[]), window_start, window_end,
    greatest(1, least(coalesce(available_capacity,1), 8)),
    greatest(0, least(coalesce(maximum_detour_minutes,10), 120)),
    '{}'::uuid[], coalesce(vehicle_type,'unspecified'),
    coalesce(vehicle_details,'{}'::jsonb), coalesce(privacy_setting,'zone_only'),
    coalesce(verification_willingness,false), 'unverified', 'active'
  ) returning id into new_id;

  return new_id;
end;
$$;
revoke all on function public.submit_participant_planned_route(uuid,uuid,text,text,smallint[],time,time,integer,integer,text,jsonb,boolean,text) from public, anon;
grant execute on function public.submit_participant_planned_route(uuid,uuid,text,text,smallint[],time,time,integer,integer,text,jsonb,boolean,text) to authenticated;

-- Participant-safe read model for match and administrative-review state.
-- Deliberately omits the other participant's identity and vehicle details.
create or replace function public.get_participant_match_previews()
returns table(
  id uuid,
  organization_id uuid,
  commuter_need_id uuid,
  planned_route_id uuid,
  origin_zone text,
  destination_zone text,
  compatibility_score numeric,
  route_fit_score numeric,
  estimated_detour_minutes integer,
  estimated_detour_miles numeric,
  time_window_fit text,
  contribution_compatibility text,
  ev_hybrid_indicator text,
  explanation jsonb,
  match_status text,
  generated_at timestamptz,
  expires_at timestamptz,
  review_decision text,
  review_rationale text,
  review_conditions jsonb,
  reviewed_at timestamptz,
  access_point_id uuid,
  access_point_name text,
  access_point_address_label text,
  access_point_review_status text
)
language sql
stable
security definer
set search_path = public, private, pg_catalog
as $$
  select
    m.id,
    m.organization_id,
    m.commuter_need_id,
    m.planned_route_id,
    n.origin_zone,
    n.destination_zone,
    m.compatibility_score,
    m.route_fit_score,
    m.estimated_detour_minutes,
    m.estimated_detour_miles,
    m.time_window_fit,
    m.contribution_compatibility,
    m.ev_hybrid_indicator,
    m.explanation,
    m.status,
    m.generated_at,
    m.expires_at,
    ar.decision,
    ar.rationale,
    coalesce(ar.conditions,'{}'::jsonb),
    ar.reviewed_at,
    ap.id,
    ap.name,
    ap.address_label,
    ap.review_status
  from public.match_previews m
  join public.commuter_needs n on n.id = m.commuter_need_id
  join public.planned_routes r on r.id = m.planned_route_id
  left join lateral (
    select x.decision, x.rationale, x.conditions, x.reviewed_at
    from public.administrative_reviews x
    where x.match_preview_id = m.id
    order by x.created_at desc
    limit 1
  ) ar on true
  left join public.access_points ap on ap.id = m.access_point_id
  where (n.user_id = (select auth.uid()) or r.user_id = (select auth.uid()))
    and m.organization_id is not null
    and private.is_org_member(m.organization_id)
  order by
    case coalesce(ar.decision,'pending')
      when 'approved_for_review' then 0
      when 'request_changes' then 1
      when 'pending' then 2
      else 3
    end,
    m.compatibility_score desc nulls last,
    m.generated_at desc;
$$;
revoke all on function public.get_participant_match_previews() from public, anon;
grant execute on function public.get_participant_match_previews() to authenticated;

comment on function public.submit_participant_commuter_need(uuid,uuid,text,text,smallint[],time,time,integer,boolean,text,jsonb,text) is
  'Participant client v1 commute-need write contract. Requires active institutional membership; approximate zones only.';
comment on function public.submit_participant_planned_route(uuid,uuid,text,text,smallint[],time,time,integer,integer,text,jsonb,boolean,text) is
  'Participant client v1 planned-route write contract. Registers an existing planned route; does not activate transportation.';
comment on function public.get_participant_match_previews() is
  'Participant-safe match preview/read-review contract. Omits counterparty identity and vehicle details.';
