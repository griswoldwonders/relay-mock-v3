# Relay Rider — Current Deployed Code & Runtime Capability Source of Truth

**Status:** Engineering source of truth  
**Audit date:** 2026-08-16  
**Product state:** Product prototype / research beta unless a governed program is explicitly established  
**Institutional repository:** `griswoldwonders/relay-mock-v3`  
**Commuter prototype repository:** `griswoldwonders/relay-rider-beta-001`  
**Live Supabase project:** `Relay-Rider-RD` / `dzrqrqfxcihvufvyctbt`

> This document is intentionally stricter than plans, screenshots, READMEs, marketing copy, or commit messages. A capability is not promoted merely because code exists. `DEPLOYMENT.json` and `CURRENT_DEPLOYED_SYSTEM_MANIFEST.json` are machine-checked companions to this document.

---

## 1. Normative files

The current deployment truth is defined by three files:

1. `DEPLOYMENT.json` — production deployment contract and database head.
2. `docs/CURRENT_DEPLOYED_SYSTEM_MANIFEST.json` — machine-readable capability classification.
3. `docs/CURRENT_DEPLOYED_SYSTEM_SOURCE_OF_TRUTH.md` — human-readable engineering interpretation.

The following commands enforce the contract:

```text
npm run check:capabilities
npm run check:migration-head
npm run check:live-migration-head
npm run check:deployment
```

`npm run build` runs `check:deployment` before compiling. CI also runs `check:deployment` explicitly. A Netlify or GitHub Pages build that uses `npm run build` therefore fails closed when the capability manifest, repository migration head, or live Supabase migration head drifts from the recorded contract.

---

## 2. Capability states

| State | Meaning |
|---|---|
| **LIVE-REACHABLE** | Reachable from the current runtime and not dependent on an absent backend object. |
| **LIVE-PERSISTED** | Reachable UI/API path plus verified live persistence prerequisites. Does not imply production-scale validation. |
| **BACKEND-LIVE / UI-DORMANT** | Backend capability is deployed but the current default UI does not expose it end-to-end. |
| **SPECIAL-VIEW** | Reachable through a special route/query rather than default navigation. |
| **PROTOTYPE-SESSION** | Interactive client behavior held in browser/session memory rather than the institutional system of record. |
| **CODE-ONLY** | Code exists but a runtime/deployment dependency is absent. |
| **SCHEMA-ONLY / BLUEPRINT** | Schema code exists but is not verified as applied to production. |
| **NOT IMPLEMENTED** | Required behavior is absent or deliberately disabled. |
| **DEPLOYMENT UNVERIFIED** | Source is known but the exact hosting deployment SHA has not been independently bound to it. |

External claims must use the weakest applicable state.

---

## 3. Source pins and runtime boundary

### Institutional/admin source

Audited main snapshot:

```text
repository: griswoldwonders/relay-mock-v3
main SHA:   3f79f13ca96519693cee634ea355dfef3b854fd4
```

Active source entry path:

```text
src/App.tsx
  -> WebRuntime
      -> InstitutionalSaasGateway
          -> OperationalSaasWorkspace
```

Special evidence routes:

```text
?view=pcc-evidence
?view=pcc-evidence-workbench
```

### Commuter prototype source

```text
repository: griswoldwonders/relay-rider-beta-001
main SHA:   e04e6867e5faa556f6af11c2f51ceebefe4272d2
```

The commuter prototype remains a separate React application using session-memory state. It is **not** the production participant client for the institutional Supabase backend.

### Hosting provenance

The exact public hosting deployment SHA remains independently unverified. This is still a P0 source-provenance gap. Do not state that a particular Git commit is exactly what Netlify or another host is serving until the deployment identifier is recorded.

---

## 4. Live production database head

Supabase project:

```text
name:       Relay-Rider-RD
project:    dzrqrqfxcihvufvyctbt
status:     ACTIVE_HEALTHY
PostgreSQL: 17
```

Verified live migration head after this audit:

```text
version:     20260817024507
name:        harden_deployment_fingerprint_20260817030000
fingerprint: c3f7955d6ce4742f3db53763c92b275a
```

The public object `public.relay_deployment_fingerprint` is now a one-row RLS table, not a security-definer view. It exposes only:

- latest migration version; and
- an MD5 fingerprint of `version:name`.

A private trigger on `supabase_migrations.schema_migrations` updates this registry whenever migration history changes. Anonymous and authenticated clients receive SELECT only; no application data or migration name is exposed. The initial security-definer-view implementation was replaced after the Supabase security advisor flagged it. Re-running the security advisor confirmed that newly introduced ERROR is gone.

Repository migration head:

```text
supabase/migrations/20260817030000_harden_deployment_fingerprint.sql
```

Any new timestamped migration must be accompanied by a reviewed `DEPLOYMENT.json` update after that migration is verified live. Otherwise the build fails.

---

## 5. Rule 2202 persistence — drift resolved and promoted narrowly

### 5.1 What existed in code

The mounted Rule 2202 workspace has six stages:

```text
Worksite
  -> Employee population
  -> VMT pathway
  -> Validation
  -> AVR & weekly VMT
  -> Compliance package
```

The client API reads/writes:

- `rule2202_reporting_years`
- `rule2202_employee_populations`
- `rule2202_validation_issues`
- `rule2202_calculation_runs`
- `rule2202_compliance_packages`

### 5.2 Production migration applied

The previously missing Rule 2202 persistence migration has now been applied to the live Supabase project:

```text
live version: 20260817023513
live name:    rule2202_persistence_20260812041000
repo source:  supabase/migrations/20260812041000_rule2202_persistence.sql
```

The five Rule 2202 tables were verified present with RLS enabled. Each has two RLS policies corresponding to scoped read and managed/review operations.

### 5.3 Runtime-grant defect discovered during verification

The first authenticated rollback smoke test failed before Rule 2202 insertion with:

```text
permission denied for table organization_sites
```

This revealed an additional runtime defect: earlier hardening revoked default table privileges, while several direct PostgREST-backed institutional/evidence APIs depended on authenticated table grants. RLS policies existed, but table privileges prevented those policies from being reached.

A follow-up production migration was applied:

```text
live version: 20260817023652
live name:    authenticated_runtime_table_grants_20260817024500
repo source:  supabase/migrations/20260817024500_authenticated_runtime_table_grants.sql
```

The migration grants authenticated runtime table privileges to the direct REST surfaces used by the SaaS foundation, PCC evidence engine, and Rule 2202 persistence layer. RLS remains the row-level authorization boundary.

### 5.4 Authenticated rollback smoke test

After the grants migration, a transaction simulated an active organization member with a managing role and successfully exercised RLS-protected persistence for:

```text
organization_sites                    1 visible
rule2202_reporting_years              1 visible
rule2202_employee_populations         1 visible
rule2202_validation_issues            1 visible
rule2202_calculation_runs             1 visible
rule2202_compliance_packages          1 visible
```

The transaction was then rolled back. A post-test query confirmed zero synthetic smoke records remained.

### 5.5 Current Rule 2202 classification

| Capability | Current state |
|---|---|
| Rule 2202 workspace UI | **LIVE-REACHABLE** |
| Reporting-year persistence | **LIVE-PERSISTED** |
| Employee-population persistence | **LIVE-PERSISTED** |
| Validation-issue persistence | **LIVE-PERSISTED** |
| Calculation-run record persistence | **LIVE-PERSISTED** |
| Compliance-package record persistence | **LIVE-PERSISTED** |
| AVR calculation executor | **NOT IMPLEMENTED end-to-end** |
| Weekly-VMT calculation executor | **NOT IMPLEMENTED end-to-end** |
| Compliance-package generation action | **NOT IMPLEMENTED end-to-end** |
| AQMD submission/filing | **NOT IMPLEMENTED** |

**Allowed claim:** Relay Rider can persist tenant-scoped Rule 2202 worksite/reporting records when an authorized institutional session and configured site are present.

**Not allowed:** saying that Relay Rider currently calculates verified AQMD AVR/VMT end-to-end, generates a finished filing package, submits to AQMD, or provides AQMD approval/certification.

---

## 6. PCC evidence engine

### Public evidence dashboard — SPECIAL-VIEW / LIVE-REACHABLE

`?view=pcc-evidence` provides source-labeled Pasadena context and explicitly keeps PCC institutional outcomes unavailable until PCC-specific records exist.

### Evidence workbench — SPECIAL-VIEW / LIVE-PERSISTED

`?view=pcc-evidence-workbench` implements:

```text
sign in
  -> select organization/site/cohort
  -> create baseline
  -> upload CSV
  -> map fields
  -> normalize
  -> validate
  -> review/exclude blocking rows
  -> insert observations and validation issues
  -> lock baseline
```

The required evidence schema and authenticated table grants are live. However, audited evidence tables currently contain zero institutional rows and this audit did not import a real PCC file. Therefore there is no live PCC baseline, observed VMT change, or emissions outcome to claim.

---

## 7. Operational engine backend

### Roster and commute ingestion — BACKEND-LIVE / UI-DORMANT

Live backend functions include `import_cohort_roster` and `import_commute_records`, with provenance, normalized rows, validation state, roster entries, approximate commute zones, schedules, parking difficulty, Access Point willingness, EV/hybrid status, and review-task structures.

### Corridor intelligence — BACKEND-LIVE / UI-DORMANT

`get_corridor_intelligence` can aggregate approximate origin/destination demand with group-size controls, parking-pressure counts, Access Point interest, EV/hybrid interest, travel days, and recency.

### Deterministic match previews — BACKEND-LIVE / UI-DORMANT

`generate_deterministic_match_previews` uses approximate origin/destination compatibility, overlapping travel days, time-window fit, Access Point preference, EV/hybrid preference, contribution compatibility, capacity, and administrative review state.

The engine explicitly records that routing is not connected. It does not calculate detour time or distance.

No live commuter needs, planned routes, or match previews were present during this audit, so no real operational match outcome may be claimed.

---

## 8. Commuter application boundary

The separate commuter beta supports interactive screens for commute-need intake, EV/hybrid planned-route registration, commute options, match previews, maps, Green Route Wallet concepts, privacy/security screens, and simulated trip journey states.

Its primary state container declares session-memory storage. Submitted route signals, EV participant signals, and Green Route Credits are not persisted to the institutional Supabase backend.

Therefore:

```text
commuter intake                 PROTOTYPE-SESSION
EV planned-route registration   PROTOTYPE-SESSION
commuter options/matches        PROTOTYPE-SESSION
Green Route Wallet              PROTOTYPE-SESSION
trip journey                    PROTOTYPE-SESSION
commuter -> admin integration   NOT IMPLEMENTED
```

The trip journey is a simulation. It is not GPS tracking, live dispatch, instant pickup, route activation, booking, payment, or guaranteed transportation.

---

## 9. Audited live data state

Aggregate-only inspection found three organization shell records and zero rows in the audited operational program tables, including:

```text
organization_sites                  0
cohorts                             0
tdm_programs                        0
data_sources                        0
ingestion_runs                      0
commute_observations                0
operational_tasks                   0
evidence_baselines                  0
evidence_commute_observations       0
evidence_metric_values              0
commuter_needs                      0
planned_routes                      0
access_points                       0
match_previews                      0
administrative_reviews              0
rule2202_reporting_years            0
rule2202_employee_populations       0
rule2202_validation_issues          0
rule2202_calculation_runs           0
rule2202_compliance_packages        0
```

The rollback smoke test did not change these counts.

The backend is real deployed infrastructure, but it has not yet demonstrated a live institution-specific operating dataset in these tables.

---

## 10. Deployment drift enforcement

### Static contract validation

`scripts/validate-capability-manifest.mjs` verifies:

- `DEPLOYMENT.json` and manifest schemas;
- Supabase project identity;
- valid capability states and unique IDs;
- Rule 2202 promotion prerequisites;
- removal of resolved Rule 2202 drift from P0 gaps;
- consistency between manifest and deployment database head;
- required forbidden live claims;
- the declared repository migration head is the newest timestamped migration;
- stored migration fingerprint matches the declared live `version:name`.

### Live database-head validation

`scripts/check-database-migration-head.mjs`:

1. identifies the newest repository migration;
2. requires it to match `DEPLOYMENT.json`;
3. calls the live Supabase migration-fingerprint table using the project's public publishable key;
4. compares the live migration version/fingerprint to `DEPLOYMENT.json`;
5. exits non-zero on any mismatch or unavailable live check.

The registry row is automatically synchronized from actual Supabase migration history by the private database trigger installed in `20260817030000_harden_deployment_fingerprint.sql`.

### CI/build rule

`.github/workflows/ci.yml` runs `npm run check:deployment` before the production bundle build.

`npm run build` itself also runs `check:deployment`, so hosting builds fail even if they are triggered outside the GitHub CI job.

This creates a fail-closed invariant:

```text
repository migration head
        == DEPLOYMENT.json contract
        == live Supabase migration fingerprint
        == capability manifest authority
```

A future schema change cannot be silently represented as deployed merely by merging migration code.

---

## 11. Current highest-priority unresolved gaps

### P0 — hosting deployment SHA provenance

Main-branch source is known, but exact hosting deployment provenance remains unverified. Add deployment metadata that records hosting provider, deployment ID, commit SHA, build time, and environment.

### P0 — commuter/admin integration

The commuter beta still does not write participant signals into the tenant-scoped institutional backend. This remains the largest end-to-end product integration gap.

### P1 — Rule 2202 calculation engine

Persistence is now live, but deterministic, versioned AVR and weekly-VMT calculation execution still needs to be built and verified from validated employee inputs.

### P1 — Rule 2202 package generation

The database can persist package records, but the UI does not yet generate a versioned review package from verified calculation outputs.

### P1 — operational UI activation

Corridor intelligence and deterministic match-preview backend functions are deployed, but the current default institutional UI does not expose the full operating workflow.

---

## 12. Change-control rule

For every future production migration:

1. create the timestamped migration in `supabase/migrations/`;
2. review and apply it to the intended Supabase production project;
3. verify RLS, grants, functions and required smoke tests;
4. query the actual live migration head;
5. update `DEPLOYMENT.json` with the verified live version/name/fingerprint and new repository migration head;
6. update capability classifications only when their required evidence is satisfied;
7. run `npm run check:deployment`;
8. merge/deploy only after all checks pass.

Do not edit the manifest to make a check pass if the live system does not support the promoted claim. The live implementation is the source evidence; the manifest records it.

---

## 13. Product guardrail

Nothing in this source-of-truth promotes Relay Rider into a taxi, TNC, on-demand ride-hailing, live dispatch, instant-pickup, guaranteed ride, unrestricted public marketplace, guaranteed earnings, or certified carbon-credit platform.

A Match Preview remains a governed commuter option. A planned route remains a trip a participant already intends to make. Access Points remain designated/reviewed coordination locations, not guaranteed-safe locations. Green Route Credits remain promotional or institution-sponsored participation benefits unless a formally established program says otherwise.
