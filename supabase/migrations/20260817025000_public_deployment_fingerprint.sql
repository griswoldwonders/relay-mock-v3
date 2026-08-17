-- Relay Rider production migration-head fingerprint.
-- Exposes only the latest migration version and a non-sensitive checksum so
-- deployment CI can verify the live database head without a privileged DB secret.

create or replace view public.relay_deployment_fingerprint as
select
  version::text as migration_version,
  md5(version::text || ':' || name) as migration_fingerprint
from supabase_migrations.schema_migrations
order by version desc
limit 1;

revoke all on table public.relay_deployment_fingerprint from public;
grant select on table public.relay_deployment_fingerprint to anon, authenticated;

comment on view public.relay_deployment_fingerprint is
  'Read-only production migration-head fingerprint for Relay Rider deployment drift checks. Does not expose migration names or application data.';
