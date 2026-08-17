-- Relay Rider authenticated runtime grants.
-- Default table privileges are intentionally hardened; direct PostgREST-backed UI
-- operations therefore require explicit grants in addition to RLS policies.
-- RLS remains the row-level authorization boundary for every table below.

grant select, insert, update, delete on table public.organization_sites to authenticated;
grant select, insert, update, delete on table public.tdm_programs to authenticated;
grant select, insert, update, delete on table public.data_sources to authenticated;
grant select, update on table public.organization_onboarding to authenticated;

grant select, insert, update, delete on table public.evidence_baselines to authenticated;
grant select, insert, update, delete on table public.evidence_observation_periods to authenticated;
grant select, insert, update, delete on table public.evidence_commute_observations to authenticated;
grant select, insert, update, delete on table public.evidence_validation_issues to authenticated;
grant select, insert, update, delete on table public.evidence_metric_values to authenticated;

grant select, insert, update, delete on table public.rule2202_reporting_years to authenticated;
grant select, insert, update, delete on table public.rule2202_employee_populations to authenticated;
grant select, insert, update, delete on table public.rule2202_validation_issues to authenticated;
grant select, insert, update, delete on table public.rule2202_calculation_runs to authenticated;
grant select, insert, update, delete on table public.rule2202_compliance_packages to authenticated;
