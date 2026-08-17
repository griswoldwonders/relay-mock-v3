-- Replace the public security-definer view with a read-only registry table.
-- A trigger on Supabase migration history keeps the registry synchronized with
-- the actual latest applied migration, while anon/authenticated receive SELECT only.

drop view if exists public.relay_deployment_fingerprint;

create table if not exists public.relay_deployment_fingerprint (
  singleton boolean primary key default true check (singleton = true),
  migration_version text not null,
  migration_fingerprint text not null check (migration_fingerprint ~ '^[a-f0-9]{32}$'),
  updated_at timestamptz not null default now()
);

alter table public.relay_deployment_fingerprint enable row level security;

revoke all on table public.relay_deployment_fingerprint from public, anon, authenticated;
grant select on table public.relay_deployment_fingerprint to anon, authenticated;

create policy relay_deployment_fingerprint_read
on public.relay_deployment_fingerprint
for select
to anon, authenticated
using (true);

create or replace function private.sync_relay_deployment_fingerprint()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.relay_deployment_fingerprint(singleton, migration_version, migration_fingerprint, updated_at)
  values (true, new.version::text, md5(new.version::text || ':' || new.name), now())
  on conflict (singleton) do update
    set migration_version = excluded.migration_version,
        migration_fingerprint = excluded.migration_fingerprint,
        updated_at = excluded.updated_at;
  return new;
end;
$$;

revoke all on function private.sync_relay_deployment_fingerprint() from public, anon, authenticated;

drop trigger if exists relay_deployment_fingerprint_sync on supabase_migrations.schema_migrations;
create trigger relay_deployment_fingerprint_sync
after insert or update of version, name on supabase_migrations.schema_migrations
for each row
execute function private.sync_relay_deployment_fingerprint();

insert into public.relay_deployment_fingerprint(singleton, migration_version, migration_fingerprint, updated_at)
select true, version::text, md5(version::text || ':' || name), now()
from supabase_migrations.schema_migrations
order by version desc
limit 1
on conflict (singleton) do update
  set migration_version = excluded.migration_version,
      migration_fingerprint = excluded.migration_fingerprint,
      updated_at = excluded.updated_at;

comment on table public.relay_deployment_fingerprint is
  'Read-only production migration-head fingerprint. Updated automatically from Supabase migration history; contains no application data or migration names.';
