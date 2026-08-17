# Relay Rider — Current Deployed Code & Runtime Capability Source of Truth

**Status:** Engineering source of truth  
**Audit date:** 2026-08-16  
**Product state:** Product prototype / research beta unless a governed program is explicitly established  
**Institutional repository:** `griswoldwonders/relay-mock-v3`  
**Commuter repository:** `griswoldwonders/relay-rider-beta-001`  
**Live Supabase project:** `Relay-Rider-RD` / `dzrqrqfxcihvufvyctbt`

> This document is intentionally stricter than plans, screenshots, READMEs, marketing copy, or commit messages. A capability is not promoted merely because code exists. `DEPLOYMENT.json` and `docs/CURRENT_DEPLOYED_SYSTEM_MANIFEST.json` are machine-checked companions to this document.

---

## 1. Normative source-of-truth files

The deployment truth is defined by:

1. `DEPLOYMENT.json` — production deployment contract and database head.
2. `docs/CURRENT_DEPLOYED_SYSTEM_MANIFEST.json` — machine-readable capability classification.
3. `docs/CURRENT_DEPLOYED_SYSTEM_SOURCE_OF_TRUTH.md` — human-readable engineering interpretation.

The following checks enforce the contract:

```text
npm run check:capabilities
npm run check:migration-head
npm run check:live-migration-head
npm run check:deployment
```

`npm run build` executes the deployment check before compiling. CI also runs it explicitly. A build fails when the capability manifest, repository migration head, or live Supabase migration fingerprint drifts from the reviewed contract.

---

## 2. Capability states

| State | Meaning |
|---|---|
| **LIVE-REACHABLE** | Reachable from the audited production runtime and not dependent on an absent backend object. |
| **LIVE-PERSISTED** | Verified live backend/persistence prerequisites exist; does not imply production-scale use or validated outcomes. |
| **BACKEND-LIVE / UI-DORMANT** | Backend capability is deployed but audited production UI does not expose it end-to-end. |
| **SPECIAL-VIEW** | Audited production capability is reachable through a special route/query rather than default navigation. |
| **PROTOTYPE-SESSION** | Interactive client behavior remains browser/session-memory prototype behavior. |
| **CODE-ONLY** | Implementation exists on a review/integration branch but is not production-deployed or fully proven. |
| **SCHEMA-ONLY / BLUEPRINT** | Schema code exists but is not verified as applied to production. |
| **NOT IMPLEMENTED** | Required behavior is absent or deliberately disabled. |
| **DEPLOYMENT UNVERIFIED** | Source is known but exact hosting deployment SHA has not been independently bound to it. |

External claims use the weakest applicable state.

---

## 3. Production source pins and branch work

### Institutional/admin production baseline

```text
repository: griswoldwonders/relay-mock-v3
main SHA:   3f79f13ca96519693cee634ea355dfef3b854fd4
```

Production source entry path:

```text
src/App.tsx
  -> WebRuntime
      -> InstitutionalSaasGateway
          -> OperationalSaasWorkspace
```

Audited production special evidence routes:

```text
?view=pcc-evidence
?view=pcc-evidence-workbench
```

The review branch `docs/current-deployed-system-2026-08-16` additionally implements an authenticated Match Preview review workspace at:

```text
?view=participant-review
```

That reviewer route is **CODE-ONLY** until it is merged and the hosting deployment is verified.

### Commuter production baseline

```text
repository: griswoldwonders/relay-rider-beta-001
main SHA:   e04e6867e5faa556f6af11c2f51ceebefe4272d2
```

Audited production main remains session-memory based.

The integration branch `engineering/commuter-backend-integration-2026-08-16` now implements authenticated institution-program connection, invitation acceptance, commuter-need persistence, planned-route persistence, and participant-safe Match Preview/review reads. That implementation passed its deployment-contract check, production dependency audit, type check, production build, application-security configuration check, tracked-secret scan, dependency review, and CodeQL. It is still **CODE-ONLY / IMPLEMENTED-NOT-DEPLOYED**, not production-live.

### Hosting provenance

The exact public hosting deployment SHA remains independently unverified for both application surfaces. Do not state that a specific Git commit is exactly what a host is serving until the deployment identifier is recorded.

---

## 4. Live production database head

Supabase project:

```text
name:       Relay-Rider-RD
project:    dzrqrqfxcihvufvyctbt
status:     ACTIVE_HEALTHY
PostgreSQL: 17
```

Current verified live migration head:

```text
version:     20260817030119
name:        participant_client_contract_v1_20260817032000
fingerprint: af49a824136167a6981787aff2cc5821
```

Repository migration head:

```text
supabase/migrations/20260817032000_participant_client_contract_v1.sql
```

`public.relay_deployment_fingerprint` is a one-row RLS table synchronized from actual Supabase migration history by a private trigger. It exposes only the migration version and a migration fingerprint through the public read contract. A new database migration must be verified live and then deliberately recorded in `DEPLOYMENT.json`; otherwise application builds fail closed.

---

## 5. Rule 2202 persistence

The mounted Rule 2202 workspace has six stages:

```text
Worksite
  -> Employee population
  -> VMT pathway
  -> Validation
  -> AVR & weekly VMT
  -> Compliance package
```

The formerly missing Rule 2202 persistence migration is live. The five Rule 2202 tables were verified with RLS and authenticated runtime grants. A rollback-only authenticated smoke transaction exercised organization-site, reporting-year, employee-population, validation-issue, calculation-run, and compliance-package persistence and left zero synthetic rows.

Current classification:

| Capability | State |
|---|---|
| Rule 2202 workspace UI | **LIVE-REACHABLE** |
| Reporting-year persistence | **LIVE-PERSISTED** |
| Employee-population persistence | **LIVE-PERSISTED** |
| Validation-issue persistence | **LIVE-PERSISTED** |
| Calculation-run record persistence | **LIVE-PERSISTED** |
| Compliance-package record persistence | **LIVE-PERSISTED** |
| AVR calculation executor | **NOT IMPLEMENTED end-to-end** |
| Weekly-VMT calculation executor | **NOT IMPLEMENTED end-to-end** |
| Compliance-package generation | **NOT IMPLEMENTED end-to-end** |
| AQMD submission/filing | **NOT IMPLEMENTED** |

Allowed claim: Relay Rider can persist tenant-scoped Rule 2202 worksite/reporting records when an authorized institutional session and configured site are present.

Not allowed: claiming verified AQMD calculation execution, finished filing-package generation, automatic AQMD submission, or AQMD approval/certification.

---

## 6. PCC evidence engine

### Public evidence dashboard — SPECIAL-VIEW / LIVE-REACHABLE

`?view=pcc-evidence` provides source-labeled Pasadena context and keeps PCC institutional outcomes unavailable until PCC-specific records exist.

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

The required schema and authenticated grants are live. The audited evidence tables contain zero institutional rows, so there is no live PCC baseline, observed VMT change, or emissions outcome to claim.

---

## 7. Operational engine backend

### Roster and commute ingestion — BACKEND-LIVE / UI-DORMANT

Live functions include `import_cohort_roster` and `import_commute_records`, with import provenance, normalized rows, validation, roster membership, approximate commute zones, schedules, parking difficulty, Access Point willingness, EV/hybrid status, and operational tasks.

### Corridor intelligence — BACKEND-LIVE / UI-DORMANT

`get_corridor_intelligence` aggregates approximate origin/destination demand with group-size controls, parking-pressure counts, Access Point interest, EV/hybrid interest, travel days, and recency.

### Deterministic Match Preview engine — BACKEND-LIVE / UI-DORMANT in production

`generate_deterministic_match_previews` uses approximate origin/destination compatibility, overlapping travel days, time-window fit, Access Point preference, EV/hybrid preference, contribution compatibility, capacity, and administrative-review rules.

The engine intentionally excludes self-matches. It also explicitly records that routing is not connected; it does not calculate detour time or distance.

Audited live `commuter_needs`, `planned_routes`, `match_previews`, and `administrative_reviews` tables contain zero rows. No real operational Match Preview outcome may therefore be claimed.

---

## 8. Live participant backend contract

The participant-client backend contract is now **LIVE-PERSISTED** in `Relay-Rider-RD`.

The production database exposes authenticated, tenant-scoped participant contracts for:

```text
accept_organization_invitation
get_participant_program_context
submit_participant_commuter_need
submit_participant_planned_route
get_participant_match_previews
```

Participant write policies were hardened so an authenticated user cannot attach a commuter need or planned route to an organization/cohort in which that user does not have active membership.

`get_participant_match_previews` is participant-safe: it returns only Match Previews associated with that participant's commuter need or planned route and omits counterparty identity and vehicle-detail fields. It can include Match Preview evidence, latest administrative-review state, and reviewed Access Point metadata.

This backend contract being live does **not** mean the commuter application is production-integrated.

---

## 9. Commuter integration branch

The commuter integration branch implements the participant side of the first governed vertical slice:

```text
account sign-in / creation
  -> institution invitation acceptance
  -> active organization/site/cohort context
  -> commute profile
  -> commuter need persistence
  -> participant-safe Match Preview/review readback
```

It also maps existing EV/hybrid planned-route registration to the live planned-route contract.

When no active institutional program is connected, the commuter app deliberately falls back to session-only prototype behavior rather than silently writing ungoverned records.

The Matches UI now separates:

1. **Governed institutional Match Previews** from the shared backend; and
2. **PROTOTYPE_SESSION simulated comparison cards**.

Green Route Credits, simulated trip progression, template matches, sample transit bundles, and modeled detour visuals remain prototype-only.

Production classification remains:

```text
commuter intake                 PROTOTYPE-SESSION on main
EV planned-route registration   PROTOTYPE-SESSION on main
commuter options/matches        PROTOTYPE-SESSION on main
Green Route Wallet              PROTOTYPE-SESSION
trip journey                    PROTOTYPE-SESSION
commuter integration branch     CODE-ONLY / CI-validated
```

---

## 10. Institutional reviewer branch

The institutional review branch implements a reviewer-only special workspace at `?view=participant-review`.

It can:

```text
institutional sign-in
  -> select organization
  -> generate deterministic Match Previews
  -> read Match Preview admin queue
  -> inspect explanation factors
  -> record administrative review decision/rationale
  -> persist review for participant-safe readback
```

The workspace calls the existing reviewer-permissioned backend and relies on RLS for organization authorization. Review decisions exposed by the UI are:

- approve for controlled review;
- request changes; or
- decline preview.

“Approve for controlled review” is explicitly not transportation confirmation, automatic route activation, payment, or guaranteed transportation.

This reviewer workspace is **CODE-ONLY** until merged/deployed and is not evidence that a real cross-user program review has occurred.

---

## 11. First cross-system proof gate

The required proof sequence is:

```text
institution invitation
  -> authenticated participant
  -> active program membership
  -> commute profile
  -> commuter need persisted
  -> separate legitimate participant has compatible planned route
  -> institutional reviewer generates deterministic Match Preview
  -> administrative review recorded
  -> participant reads reviewed option
```

Current status:

- live tenant-scoped backend contract: **complete**;
- commuter participant-side implementation: **code-complete and CI-validated on branch**;
- institutional reviewer implementation: **code-complete and build-validated on branch**;
- real institution-issued participant invitation proof: **not complete**;
- second legitimate compatible planned-route participant: **not available in audited data**;
- cross-user Match Preview/review/readback browser proof: **not complete**;
- production hosting deployment verification: **not complete**.

Because the live auth project currently has only one user and the matcher intentionally excludes self-matches, the remaining proof cannot honestly be manufactured from the existing live dataset. Synthetic persistent production participants must not be created just to make the demonstration appear complete.

---

## 12. Audited live data state

Aggregate-only inspection currently shows three organization shell records and zero rows in audited operational program tables:

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

The backend is real deployed infrastructure, but these tables do not yet evidence a live institution-specific commuter operating dataset.

---

## 13. Deployment drift enforcement

`scripts/validate-capability-manifest.mjs` verifies the deployment/manifest schemas, Supabase project identity, capability states, Rule 2202 promotion prerequisites, repository migration head, live migration fingerprint, and required forbidden claims.

`scripts/check-database-migration-head.mjs` verifies:

1. newest repository migration;
2. `DEPLOYMENT.json` repository head;
3. live Supabase migration fingerprint; and
4. exact version/fingerprint agreement.

CI and `npm run build` enforce this invariant:

```text
repository migration head
        == DEPLOYMENT.json contract
        == live Supabase migration fingerprint
        == capability manifest authority
```

Production dependency gates use `npm audit --omit=dev --audit-level=high`. Development-tool advisories remain documented engineering debt and continue to be covered by dependency review/static analysis rather than being misrepresented as production-runtime vulnerabilities.

---

## 14. Highest-priority unresolved gaps

### P0 — hosting deployment SHA provenance

Record hosting provider, deployment ID, commit SHA, build time, and environment for both application surfaces.

### P0 — real cross-user participant/admin proof

The participant and reviewer implementations now exist, but a legitimate governed-program proof requires an institution-issued invitation and a separate compatible planned-route participant.

### P1 — production merge/deploy of participant/reviewer integrations

Do not promote either integration before branch protection/CI, deployment provenance, and the controlled proof procedure are satisfied.

### P1 — Rule 2202 calculation engine

Persistence is live; versioned AVR and weekly-VMT calculation execution remains to be built and verified from validated employee inputs.

### P1 — live routing/detour provider

The Match Preview engine correctly leaves detour null because no routing service is connected. Do not substitute modeled prototype detours for live routing evidence.

---

## 15. Change-control rule

For each production database migration:

1. create the timestamped migration in `supabase/migrations/`;
2. review and apply it to the intended Supabase production project;
3. verify RLS, grants, functions, and required smoke tests;
4. query the actual live migration head;
5. update `DEPLOYMENT.json` with the verified version/name/fingerprint and repository head;
6. update capability classifications only when required evidence is satisfied;
7. run the deployment checks;
8. merge/deploy only after all required checks pass.

For application-only integration changes, preserve the distinction between branch implementation and verified hosted production. Do not edit a capability state merely to make a check pass.

---

## 16. Product guardrail

Nothing in this source of truth promotes Relay Rider into a taxi, TNC, on-demand ride-hailing, live dispatch, instant-pickup, guaranteed ride, unrestricted public marketplace, guaranteed earnings, or certified carbon-credit platform.

A Match Preview remains a governed commuter option. A planned route remains a trip a participant already intends to make. Access Points remain reviewed/designated coordination locations, not guaranteed-safe locations. Green Route Credits remain promotional or institution-sponsored participation benefits unless a formally established program says otherwise.
