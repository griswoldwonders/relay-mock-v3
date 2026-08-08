# Relay Rider SaaS Foundation Sprint

This sprint moves Relay Rider from an institutional TDM demonstration toward a real multi-tenant SaaS foundation.

## Product hierarchy

Relay Rider SaaS Platform → Mobility Intelligence / Program Administration → Corridor Exchange → Participant App.

Corridor Exchange remains a governed commuter-coordination module built around planned routes, compatible schedules, Access Points, participant privacy, and administrative review. It is not a ride-hailing or live-dispatch service.

## Implemented foundation

- Supabase email/password authentication in the institutional shell.
- Organizations and authenticated organization-owner creation.
- Organization memberships with expanded institutional roles.
- Tenant-scoped sites.
- Site-scoped and organization-wide cohorts.
- Persistent TDM program records.
- Participant directory RPC that excludes names, phone numbers, and exact locations.
- Data-source registry for participant intake, surveys, rosters, parking, GTFS/GTFS-RT, EV charging, HRIS/SIS, and manual data.
- Organization onboarding checklist.
- Organization-scoped audit-event viewer backed by database audit triggers.
- RLS and role helpers for management, review, and analysis privileges.

## Roles

- owner
- admin
- program_admin
- tdm_manager
- sustainability_manager
- site_manager
- analyst
- reviewer
- participant

Management roles can configure institutional objects. Reviewer access is limited to governed review workflows rather than full administration. Analyst/reviewer read access is scoped by organization and enforced by RLS/helper functions.

## Data boundaries

Research-beta staging records remain separate from authenticated canonical participant records. No automatic promotion of anonymous research records is performed.

Institutional demo/model metrics remain labeled until source-backed pipelines populate them. Creating an organization, site, cohort, program, or data-source record does not imply a live transportation service, customer relationship, regulatory approval, or guaranteed outcome.

## Next engineering layer

1. Admin invitations and membership lifecycle UI.
2. Site-level role assignments.
3. Cohort member enrollment/import.
4. Program ↔ site/cohort linking UI.
5. CSV ingest jobs with validation and provenance.
6. Real corridor clustering / option-coverage computation.
7. Deterministic Match Preview Engine.
8. Task queue and administrative-review lifecycle.
9. Reporting periods, saved reports, methodology and source lineage.
10. Enterprise auth (Google/Microsoft first; SAML/SCIM later).
