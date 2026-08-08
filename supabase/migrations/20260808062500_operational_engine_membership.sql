-- Relay Rider operational engine: governed invitations and member management.

create or replace function public.create_organization_invitation(
  org_id uuid,
  invite_email text,
  invite_role text,
  invite_site_id uuid default null,
  invite_site_role text default null,
  invite_cohort_id uuid default null,
  expires_days integer default 7
)
returns table(invitation_id uuid, invite_token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  clean_email text := lower(trim(invite_email));
  raw_token text;
  token_digest text;
  expiry timestamptz;
  new_id uuid;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if not private.can_manage_org(org_id) then raise exception 'Organization management permission required'; end if;
  if clean_email = '' or position('@' in clean_email) <= 1 then raise exception 'Valid invitation email required'; end if;
  if invite_role not in ('admin','program_admin','tdm_manager','sustainability_manager','site_manager','analyst','reviewer','participant') then
    raise exception 'Unsupported invitation role';
  end if;
  if invite_site_role is not null and invite_site_role not in ('site_member','site_manager','analyst','reviewer','participant') then
    raise exception 'Unsupported site role';
  end if;
  if invite_site_id is not null and not exists (select 1 from public.organization_sites s where s.id = invite_site_id and s.organization_id = org_id) then
    raise exception 'Site does not belong to organization';
  end if;
  if invite_cohort_id is not null and not exists (select 1 from public.cohorts c where c.id = invite_cohort_id and c.organization_id = org_id) then
    raise exception 'Cohort does not belong to organization';
  end if;

  update public.organization_invitations
  set status = case when expires_at <= now() then 'expired' else 'revoked' end,
      updated_at = now()
  where organization_id = org_id
    and lower(invited_email) = clean_email
    and status = 'pending';

  raw_token := encode(gen_random_bytes(32),'hex');
  token_digest := encode(digest(raw_token,'sha256'),'hex');
  expiry := now() + make_interval(days => greatest(1,least(coalesce(expires_days,7),30)));

  insert into public.organization_invitations(
    organization_id, invited_email, role, site_id, site_role, cohort_id,
    token_hash, expires_at, invited_by
  ) values (
    org_id, clean_email, invite_role, invite_site_id, invite_site_role, invite_cohort_id,
    token_digest, expiry, uid
  ) returning id into new_id;

  invitation_id := new_id;
  invite_token := raw_token;
  expires_at := expiry;
  return next;
end;
$$;
revoke all on function public.create_organization_invitation(uuid,text,text,uuid,text,uuid,integer) from public, anon;
grant execute on function public.create_organization_invitation(uuid,text,text,uuid,text,uuid,integer) to authenticated;

create or replace function public.accept_organization_invitation(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  user_email text := lower(coalesce(auth.jwt()->>'email',''));
  inv public.organization_invitations%rowtype;
  org_id uuid;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if coalesce(trim(invite_token),'') = '' then raise exception 'Invitation token required'; end if;
  if user_email = '' then raise exception 'Authenticated account email is required'; end if;

  select * into inv
  from public.organization_invitations i
  where i.token_hash = encode(digest(invite_token,'sha256'),'hex')
  order by i.created_at desc
  limit 1
  for update;

  if inv.id is null then raise exception 'Invitation not found'; end if;
  if inv.status <> 'pending' then raise exception 'Invitation is no longer pending'; end if;
  if inv.expires_at <= now() then
    update public.organization_invitations set status='expired', updated_at=now() where id=inv.id;
    raise exception 'Invitation has expired';
  end if;
  if lower(inv.invited_email) <> user_email then raise exception 'Invitation email does not match authenticated account'; end if;

  insert into public.profiles(id) values (uid) on conflict (id) do nothing;
  insert into public.organization_members(organization_id,user_id,role,status)
  values (inv.organization_id,uid,inv.role,'active')
  on conflict (organization_id,user_id) do update
    set role=excluded.role,status='active';

  if inv.site_id is not null then
    insert into public.organization_member_sites(organization_id,site_id,user_id,role)
    values (inv.organization_id,inv.site_id,uid,coalesce(inv.site_role,'site_member'))
    on conflict (site_id,user_id) do update set role=excluded.role;
  end if;

  if inv.cohort_id is not null then
    insert into public.cohort_members(organization_id,cohort_id,user_id,status)
    values (inv.organization_id,inv.cohort_id,uid,'active')
    on conflict (cohort_id,user_id) do update set status='active';
  end if;

  update public.organization_invitations
  set status='accepted', accepted_by=uid, accepted_at=now(), updated_at=now()
  where id=inv.id;

  org_id := inv.organization_id;
  return org_id;
end;
$$;
revoke all on function public.accept_organization_invitation(text) from public, anon;
grant execute on function public.accept_organization_invitation(text) to authenticated;

create or replace function public.get_organization_member_directory(org_id uuid)
returns table(
  user_id uuid,
  email text,
  role text,
  status text,
  member_since timestamptz,
  site_count bigint,
  cohort_count bigint
)
language sql
stable
security definer
set search_path = public, auth, private, pg_catalog
as $$
  select m.user_id,
         u.email::text,
         m.role,
         m.status,
         m.created_at,
         (select count(*) from public.organization_member_sites ms where ms.organization_id=org_id and ms.user_id=m.user_id),
         (select count(*) from public.cohort_members cm where cm.organization_id=org_id and cm.user_id=m.user_id and cm.status='active')
  from public.organization_members m
  join auth.users u on u.id=m.user_id
  where m.organization_id=org_id
    and private.can_manage_org(org_id)
  order by m.created_at asc;
$$;
revoke all on function public.get_organization_member_directory(uuid) from public, anon;
grant execute on function public.get_organization_member_directory(uuid) to authenticated;

create or replace function public.update_organization_member(
  org_id uuid,
  target_user_id uuid,
  new_role text,
  new_status text
)
returns void
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  current_role text;
  active_owner_count integer;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if not private.can_manage_org(org_id) then raise exception 'Organization management permission required'; end if;
  if new_role not in ('owner','admin','program_admin','tdm_manager','sustainability_manager','site_manager','analyst','reviewer','participant') then raise exception 'Unsupported role'; end if;
  if new_status not in ('active','invited','suspended','disabled') then raise exception 'Unsupported member status'; end if;

  select role into current_role from public.organization_members where organization_id=org_id and user_id=target_user_id for update;
  if current_role is null then raise exception 'Organization member not found'; end if;

  if new_role='owner' and not private.has_org_role(org_id,array['owner']) then
    raise exception 'Only an owner can promote another owner';
  end if;

  if current_role='owner' and (new_role<>'owner' or new_status<>'active') then
    select count(*) into active_owner_count from public.organization_members where organization_id=org_id and role='owner' and status='active';
    if active_owner_count <= 1 then raise exception 'Organization must retain at least one active owner'; end if;
  end if;

  update public.organization_members
  set role=new_role,status=new_status
  where organization_id=org_id and user_id=target_user_id;
end;
$$;
revoke all on function public.update_organization_member(uuid,uuid,text,text) from public, anon;
grant execute on function public.update_organization_member(uuid,uuid,text,text) to authenticated;
