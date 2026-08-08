-- Relay Rider operational engine: corridor intelligence and deterministic match previews.

create or replace function private.time_to_minutes(value time)
returns integer
language sql
immutable
as $$
  select case when value is null then null else (extract(hour from value)::integer * 60 + extract(minute from value)::integer) end;
$$;

create or replace function public.get_corridor_intelligence(org_id uuid, min_group_size integer default 3)
returns table(
  origin_zone text,
  destination_zone text,
  signal_count bigint,
  imported_signal_count bigint,
  authenticated_signal_count bigint,
  parking_pressure_count bigint,
  access_point_interest_count bigint,
  ev_hybrid_interest_count bigint,
  travel_days smallint[],
  average_parking_difficulty numeric,
  latest_signal_at timestamptz
)
language sql
stable
security definer
set search_path = public, private, pg_catalog
as $$
with signals as (
  select lower(trim(o.origin_zone)) origin_key,
         lower(trim(o.destination_zone)) destination_key,
         o.origin_zone,
         o.destination_zone,
         'imported'::text source_kind,
         'r:' || coalesce(o.roster_entry_id::text,o.id::text) signal_key,
         o.travel_days,
         o.parking_difficulty,
         o.access_point_willing,
         (o.ev_hybrid_status in ('ev','hybrid','plug_in_hybrid','prefer_ev_hybrid')) ev_interest,
         o.created_at signal_at
  from public.commute_observations o
  where o.organization_id=org_id and o.status='active' and private.can_analyze_org(org_id)
  union all
  select lower(trim(n.origin_zone)),
         lower(trim(n.destination_zone)),
         n.origin_zone,
         n.destination_zone,
         'authenticated',
         'u:' || n.user_id::text,
         n.travel_days,
         n.parking_difficulty,
         n.access_point_willingness,
         (n.ev_hybrid_preference <> 'no_preference'),
         n.updated_at
  from public.commuter_needs n
  where n.organization_id=org_id and n.status='active' and private.can_analyze_org(org_id)
), grouped as (
  select origin_key,destination_key,
         min(origin_zone) origin_zone,
         min(destination_zone) destination_zone,
         count(distinct signal_key) signal_count,
         count(distinct signal_key) filter (where source_kind='imported') imported_signal_count,
         count(distinct signal_key) filter (where source_kind='authenticated') authenticated_signal_count,
         count(distinct signal_key) filter (where parking_difficulty>=4) parking_pressure_count,
         count(distinct signal_key) filter (where access_point_willing) access_point_interest_count,
         count(distinct signal_key) filter (where ev_interest) ev_hybrid_interest_count,
         round(avg(parking_difficulty)::numeric,2) average_parking_difficulty,
         max(signal_at) latest_signal_at
  from signals
  group by origin_key,destination_key
  having count(distinct signal_key) >= greatest(1,least(coalesce(min_group_size,3),50))
), days as (
  select s.origin_key,s.destination_key,array_agg(distinct d order by d)::smallint[] travel_days
  from signals s cross join lateral unnest(s.travel_days) d
  group by s.origin_key,s.destination_key
)
select g.origin_zone,g.destination_zone,g.signal_count,g.imported_signal_count,g.authenticated_signal_count,
       g.parking_pressure_count,g.access_point_interest_count,g.ev_hybrid_interest_count,
       coalesce(d.travel_days,'{}'::smallint[]),g.average_parking_difficulty,g.latest_signal_at
from grouped g
left join days d using(origin_key,destination_key)
order by g.signal_count desc,g.origin_zone,g.destination_zone;
$$;
revoke all on function public.get_corridor_intelligence(uuid,integer) from public, anon;
grant execute on function public.get_corridor_intelligence(uuid,integer) to authenticated;

create or replace function public.generate_deterministic_match_previews(org_id uuid, max_results_per_need integer default 5)
returns integer
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  inserted_count integer := 0;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if not private.can_review_org(org_id) then raise exception 'Review permission required'; end if;

  update public.match_previews
  set status='expired', expires_at=coalesce(expires_at,now())
  where organization_id=org_id and status in ('simulated','awaiting_admin_review');

  with candidates as (
    select
      n.id commuter_need_id,
      r.id planned_route_id,
      n.organization_id,
      case
        when n.preferred_access_point_ids && r.preferred_access_point_ids then (n.preferred_access_point_ids && r.preferred_access_point_ids)
        else false
      end has_shared_access_point,
      cardinality(array(select unnest(n.travel_days) intersect select unnest(r.travel_days))) overlap_days,
      case
        when n.earliest_departure is null or n.latest_departure is null or r.earliest_departure is null or r.latest_departure is null then 'moderate'
        when n.earliest_departure <= r.latest_departure and r.earliest_departure <= n.latest_departure then 'strong'
        when greatest(
          private.time_to_minutes(n.earliest_departure),private.time_to_minutes(r.earliest_departure)
        ) - least(
          private.time_to_minutes(n.latest_departure),private.time_to_minutes(r.latest_departure)
        ) <= n.flexibility_minutes then 'moderate'
        else 'none'
      end time_fit,
      case
        when n.proposed_contribution is null or r.contribution_review_min is null or r.contribution_review_max is null then 'not_reviewed'
        when n.proposed_contribution between r.contribution_review_min and r.contribution_review_max then 'compatible'
        when n.proposed_contribution < r.contribution_review_min then 'gap'
        else 'outside_range'
      end contribution_fit,
      case
        when n.ev_hybrid_preference='no_preference' then 100
        when n.ev_hybrid_preference='ev_only' and r.vehicle_type='ev' then 100
        when n.ev_hybrid_preference='ev_only' then 0
        when n.ev_hybrid_preference='ev_or_hybrid' and r.vehicle_type in ('ev','hybrid','plug_in_hybrid') then 100
        when n.ev_hybrid_preference='ev_or_hybrid' then 30
        when n.ev_hybrid_preference='preferred' and r.vehicle_type in ('ev','hybrid','plug_in_hybrid') then 90
        else 60
      end ev_score,
      case
        when n.ev_hybrid_preference='ev_only' and r.vehicle_type<>'ev' then false
        else true
      end ev_eligible,
      case
        when n.preferred_access_point_ids && r.preferred_access_point_ids then 100
        when n.access_point_willingness and cardinality(r.preferred_access_point_ids)>0 then 70
        when cardinality(n.preferred_access_point_ids)=0 and cardinality(r.preferred_access_point_ids)=0 then 60
        else 40
      end access_score,
      case
        when n.proposed_contribution is null or r.contribution_review_min is null or r.contribution_review_max is null then 70
        when n.proposed_contribution between r.contribution_review_min and r.contribution_review_max then 100
        else 55
      end contribution_score,
      r.vehicle_type,
      n.origin_zone,
      n.destination_zone
    from public.commuter_needs n
    join public.planned_routes r
      on r.organization_id=n.organization_id
     and r.user_id<>n.user_id
     and lower(trim(r.origin_zone))=lower(trim(n.origin_zone))
     and lower(trim(r.destination_zone))=lower(trim(n.destination_zone))
     and r.travel_days && n.travel_days
    where n.organization_id=org_id
      and n.status='active'
      and r.status='active'
      and r.available_capacity>0
  ), scored as (
    select c.*,
      least(100,40 + c.overlap_days*20) day_score,
      case c.time_fit when 'strong' then 100 when 'moderate' then 70 else 0 end time_score,
      round((
        100*0.35 +
        least(100,40 + c.overlap_days*20)*0.20 +
        (case c.time_fit when 'strong' then 100 when 'moderate' then 70 else 0 end)*0.20 +
        c.access_score*0.10 + c.ev_score*0.10 + c.contribution_score*0.05
      )::numeric,2) compatibility_score
    from candidates c
    where c.ev_eligible and c.time_fit<>'none'
  ), ranked as (
    select s.*,row_number() over(partition by s.commuter_need_id order by s.compatibility_score desc,s.planned_route_id) rn
    from scored s
  )
  insert into public.match_previews(
    commuter_need_id,planned_route_id,organization_id,access_point_id,compatibility_score,route_fit_score,
    estimated_detour_minutes,estimated_detour_miles,time_window_fit,contribution_compatibility,ev_hybrid_indicator,
    explanation,status,generated_at,expires_at
  )
  select
    commuter_need_id,planned_route_id,organization_id,null,compatibility_score,100,
    null,null,time_fit,contribution_fit,
    case when vehicle_type in ('ev','hybrid','plug_in_hybrid') then vehicle_type else 'other_or_unspecified' end,
    jsonb_build_object(
      'engine_version','deterministic-v1',
      'route_basis','same approximate origin and destination zones',
      'shared_days',overlap_days,
      'time_fit',time_fit,
      'access_point_factor',case when has_shared_access_point then 'shared designated Access Point preference' else 'no shared Access Point required for this preview' end,
      'ev_hybrid_factor',case when ev_score>=90 then 'EV/hybrid preference aligned' when ev_score=0 then 'EV preference incompatible' else 'EV/hybrid preference not determinative' end,
      'contribution_factor',contribution_fit,
      'detour_estimate','not calculated: routing service is not connected',
      'guardrail','match preview only; administrative review required; no transportation is guaranteed'
    ),
    'awaiting_admin_review',now(),now()+interval '14 days'
  from ranked
  where rn<=greatest(1,least(coalesce(max_results_per_need,5),20));

  get diagnostics inserted_count = row_count;

  if inserted_count>0 then
    insert into public.operational_tasks(organization_id,category,priority,title,detail,subject_type,created_by)
    values(org_id,'match_review','high','Review generated Match Previews',format('%s deterministic commuter options are awaiting administrative review.',inserted_count),'match_preview_batch',uid);
  end if;

  return inserted_count;
end;
$$;
revoke all on function public.generate_deterministic_match_previews(uuid,integer) from public, anon;
grant execute on function public.generate_deterministic_match_previews(uuid,integer) to authenticated;

create or replace function public.get_match_preview_admin_queue(org_id uuid)
returns table(
  id uuid,
  origin_zone text,
  destination_zone text,
  compatibility_score numeric,
  route_fit_score numeric,
  time_window_fit text,
  contribution_compatibility text,
  ev_hybrid_indicator text,
  explanation jsonb,
  status text,
  generated_at timestamptz,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public, private, pg_catalog
as $$
  select m.id,n.origin_zone,n.destination_zone,m.compatibility_score,m.route_fit_score,m.time_window_fit,
         m.contribution_compatibility,m.ev_hybrid_indicator,m.explanation,m.status,m.generated_at,m.expires_at
  from public.match_previews m
  join public.commuter_needs n on n.id=m.commuter_need_id
  where m.organization_id=org_id and private.can_analyze_org(org_id)
  order by case m.status when 'awaiting_admin_review' then 0 else 1 end,m.compatibility_score desc nulls last,m.generated_at desc
  limit 250;
$$;
revoke all on function public.get_match_preview_admin_queue(uuid) from public, anon;
grant execute on function public.get_match_preview_admin_queue(uuid) to authenticated;

-- Align match/review RLS with the expanded institutional role helpers.
drop policy if exists match_previews_admin_insert on public.match_previews;
drop policy if exists match_previews_admin_update on public.match_previews;
drop policy if exists match_previews_admin_delete on public.match_previews;
drop policy if exists match_previews_participant_select on public.match_previews;
create policy match_previews_review_insert on public.match_previews for insert to authenticated with check (organization_id is not null and private.can_review_org(organization_id));
create policy match_previews_review_update on public.match_previews for update to authenticated using (organization_id is not null and private.can_review_org(organization_id)) with check (organization_id is not null and private.can_review_org(organization_id));
create policy match_previews_review_delete on public.match_previews for delete to authenticated using (organization_id is not null and private.can_review_org(organization_id));
create policy match_previews_participant_or_analyst_select on public.match_previews for select to authenticated using (
  exists(select 1 from public.commuter_needs n where n.id=match_previews.commuter_need_id and n.user_id=(select auth.uid()))
  or exists(select 1 from public.planned_routes r where r.id=match_previews.planned_route_id and r.user_id=(select auth.uid()))
  or (organization_id is not null and private.can_analyze_org(organization_id))
);

drop policy if exists reviews_participant_select on public.administrative_reviews;
create policy reviews_participant_or_analyst_select on public.administrative_reviews for select to authenticated using (
  exists(
    select 1 from public.match_previews m
    join public.commuter_needs n on n.id=m.commuter_need_id
    join public.planned_routes r on r.id=m.planned_route_id
    where m.id=administrative_reviews.match_preview_id and (n.user_id=(select auth.uid()) or r.user_id=(select auth.uid()))
  )
  or (organization_id is not null and private.can_analyze_org(organization_id))
);
