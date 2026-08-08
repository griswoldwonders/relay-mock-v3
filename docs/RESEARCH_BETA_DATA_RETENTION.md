# Relay Rider Research Beta Data Retention

## Policy

Research-beta intake records are retained for no more than 90 days from the date of initial submission and are then automatically deleted from the research staging table.

The 90-day clock does not reset when a participant edits the record. Each record stores a fixed `retention_expires_at` timestamp based on its original `created_at` time.

If a participant withdraws before the 90-day deadline:

- the record is immediately marked `withdrawn`;
- it is no longer eligible for future match-preview processing or participant-network promotion;
- the record remains subject to the original 90-day deletion deadline and is automatically deleted no later than that date.

## Scope

This policy applies to `public.research_beta_intake`, the anonymous research-beta staging table. It does not automatically govern the separate authenticated production/governed-program tables such as `profiles`, `commuter_needs`, `planned_routes`, `consent_records`, or `match_previews`; those require their own retention policy before a governed participant network is launched.

## Enforcement

Supabase stores `retention_expires_at` on each research-beta record. A daily `pg_cron` job named `purge_research_beta_intake_90d` calls `private.purge_expired_research_beta_intake()` and permanently deletes expired staging records.

Direct anonymous table access remains disabled. Anonymous research-beta access is limited to the token-gated save/load/withdraw RPCs established for the research prototype.
