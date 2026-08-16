# Relay Rider — Current Deployed Code & Runtime Capability Source of Truth

**Status:** Engineering source of truth  
**Audit date:** 2026-08-16  
**Product state:** Product prototype / research beta unless a governed program is explicitly established  
**Primary institutional runtime repository:** `griswoldwonders/relay-mock-v3`  
**Primary commuter prototype repository:** `griswoldwonders/relay-rider-beta-001`  
**Marketing repository:** `griswoldwonders/relayrider.app`  
**Live Supabase project:** `Relay-Rider-RD` / project ref `dzrqrqfxcihvufvyctbt`  

> This document describes what the current code and live backend can support. It is intentionally stricter than product plans, README claims, screenshots, commit messages, or mockups. A capability is not called live merely because code exists for it.

---

## 1. Purpose

Relay Rider needs one engineering document that answers, without ambiguity:

1. What code is on the current main branches?
2. Which code is actually reachable from the active runtime entrypoints?
3. Which backend tables and functions are actually present in the live Supabase project?
4. Which workflows persist data end-to-end?
5. Which workflows are interactive prototypes only?
6. Which features are dormant, schema-only, disabled, missing, or contradicted by deployment state?
7. What evidence is required before a feature may be described externally as operational?

This file is the normative answer until replaced by a later audited revision.

## 2. Claim discipline

Every capability in this file is assigned one of the following states.

| State | Meaning |
|---|---|
| **LIVE-REACHABLE** | Reachable from the current runtime entrypoint and does not depend on an absent backend object. |
| **LIVE-PERSISTED** | Reachable UI/API path plus required live backend objects are present. This does **not** imply production-scale validation. |
| **BACKEND-LIVE / UI-DORMANT** | Required database tables/functions are deployed, but the current default UI does not expose the workflow. |
| **SPECIAL-VIEW** | Reachable only through an explicit query/view route rather than the default product navigation. |
| **PROTOTYPE-SESSION** | Interactive client prototype; state exists only in browser memory/session and is not an institutional system of record. |
| **CODE-ONLY** | Source code exists, but it is not reachable from the active runtime and/or its required deployment dependency is absent. |
| **SCHEMA-ONLY / BLUEPRINT** | Migration or schema code exists in a repository but is not verified as applied to the live backend. |
| **NOT IMPLEMENTED** | Required operational behavior is absent or deliberately disabled. |
| **DEPLOYMENT UNVERIFIED** | Main-branch source is known, but the exact hosting deployment SHA has not been independently bound to that commit. |

**Rule:** external claims must use the weakest applicable state, not the strongest plausible interpretation.

---

## 3. Audited source pins

### 3.1 Institutional/admin runtime

Repository: `griswoldwonders/relay-mock-v3`  
Audited `main` commit: `3f79f13ca96519693cee634ea355dfef3b854fd4`  
Commit message: `Style persistent Rule 2202 controls`

The active entry path is:

```text
src/App.tsx
  -> WebRuntime
      -> InstitutionalSaasGateway
          -> OperationalSaasWorkspace
```

`WebRuntime` also exposes two explicit evidence routes:

```text
?view=pcc-evidence
?view=pcc-evidence-workbench
```

### 3.2 Commuter prototype

Repository: `griswoldwonders/relay-rider-beta-001`  
Audited `main` commit: `e04e6867e5faa556f6af11c2f51ceebefe4272d2`  
Commit message: `Fix Home schedule-fit badge alignment`

### 3.3 Marketing site

Repository: `griswoldwonders/relayrider.app`  
Most recent audited commit in this review: `58e56cf6c7d1d04fc89a384c3d1579844e2603`  
Commit message: `Clarify Rule 2202 support positioning`

The marketing site is not evidence that an operational workflow exists.

### 3.4 Deployment binding

`relay-mock-v3` contains a Netlify build configuration:

```text
build command: npm run build
publish directory: dist/client
SPA fallback: /* -> /index.html
```

The repository also prepares a Sites-compatible server/hosting bundle during `npm run build`.

**Current audit limitation:** the exact public hosting deployment SHA was not independently resolved from Netlify/hosting metadata during this audit. Therefore the repository commit pins above are authoritative code snapshots, but the statement “this exact SHA is what Netlify is serving” remains **DEPLOYMENT UNVERIFIED** until a deployment identifier is recorded.

---

## 4. System boundary

Relay Rider currently consists of several separate surfaces, not one fully integrated application.

```text
                         +---------------------------+
                         | relayrider.app            |
                         | marketing / positioning   |
                         +-------------+-------------+
                                       |
                         no verified shared session
                                       |
        +------------------------------+------------------------------+
        |                                                             |
+-------v----------------+                               +------------v-------------+
| relay-rider-beta-001  |                               | relay-mock-v3            |
| commuter research UI  |                               | institutional/admin UI   |
| session-memory state  |                               | + evidence workbench     |
+-----------------------+                               +-------------+------------+
                                                                      |
                                                                      v
                                                        +---------------------------+
                                                        | Supabase Relay-Rider-RD   |
                                                        | deployed institutional DB |
                                                        +---------------------------+
```

The commuter beta is **not currently wired as the participant front end of the institutional Supabase system**. That integration must not be implied.

---

## 5. Current default institutional/admin UI

`OperationalSaasWorkspace` is the default admin surface. Its current navigation is:

1. Command Center
2. Rule 2202
3. Tasks & Reviews
4. Commute Data
5. Origin & Corridor Context
6. EV / ZEV Context
7. Reports
8. Data Settings

The default geography shown in the demo is Pasadena, California.

### 5.1 Command Center — **LIVE-REACHABLE**

The Command Center can display public Pasadena context and institutional readiness states. Employer-specific values such as worksite population, AVR, weekly VMT, telecommute activity, and filing status are intentionally unavailable until a verified employer data source is connected.

This is correct product-state behavior: public data is contextual evidence, not a substitute for employer commute records.

### 5.2 Public Pasadena data registry — **LIVE-REACHABLE**

The code carries source-labeled Pasadena context including ACS commute shares and Pasadena Water & Power charger status. These values are stored with source, vintage, geography, evidence class, and notes.

A separate PCC evidence dashboard can also call the Census API for 2024 ACS 5-Year B08301 data at runtime. That dashboard labels the results as Pasadena residence-based context and explicitly states they are not PCC commuter behavior.

### 5.3 Tasks & Reviews — **LIVE-REACHABLE, LIMITED**

The default workspace displays task/readiness concepts, but the active screen is not currently a complete operational queue over all deployed `operational_tasks` records. The backend task table is live; the richer operational engine UI that originally exposed more of this workflow is not mounted in the current default app.

### 5.4 Reports — **LIVE-REACHABLE, PRESENTATION ONLY**

Current report surfaces present readiness/status cards and evidence framing. They do **not** constitute a complete versioned report-generation pipeline. There is no basis to claim that Relay Rider currently generates a finished Rule 2202 filing package or a production Corridor Decision Brief end-to-end from the default UI.

### 5.5 Data Settings — **LIVE-REACHABLE**

The workspace exposes evidence-policy and methodology statements, including:

- public ACS context is contextual only;
- verified employer records are required for employer metrics;
- AQMD filing status is not inferred;
- automatic Rule 2202 submission is disabled;
- modeled reductions remain hidden until required inputs exist.

---

## 6. Rule 2202 workbench: critical code/deployment drift

### 6.1 UI implementation

The default admin runtime mounts an interactive Rule 2202 workbench with six workflow stages:

```text
Worksite
  -> Employee population
  -> VMT pathway
  -> Validation
  -> AVR & weekly VMT
  -> Compliance package
```

The UI code supports authentication through Supabase Auth and contains REST calls for:

- `rule2202_reporting_years`
- `rule2202_employee_populations`
- `rule2202_validation_issues`
- `rule2202_calculation_runs`
- `rule2202_compliance_packages`

A GitHub migration, `supabase/migrations/20260812041000_rule2202_persistence.sql`, defines those tables, RLS policies, audit triggers, and constraints.

### 6.2 Live backend verification

**The Rule 2202 migration is not applied to the live Supabase project as of this audit.**

Live migration history currently ends with:

```text
20260811202929  pcc_evidence_engine_v2
```

The live database does **not** contain the five `rule2202_*` tables listed above.

### 6.3 Current classification

| Rule 2202 capability | State |
|---|---|
| Public/read-only Rule 2202 screen | **LIVE-REACHABLE** |
| Authenticated organization/site selection | **LIVE-PERSISTED** through the general SaaS foundation |
| Create Rule 2202 reporting year | **CODE-ONLY / BLOCKED BY MISSING LIVE SCHEMA** |
| Save employee population snapshot | **CODE-ONLY / BLOCKED BY MISSING LIVE SCHEMA** |
| Persist validation issues | **CODE-ONLY / BLOCKED BY MISSING LIVE SCHEMA** |
| Persist AVR/VMT calculation runs | **CODE-ONLY / BLOCKED BY MISSING LIVE SCHEMA** |
| Generate compliance package | **NOT IMPLEMENTED end-to-end** |
| Submit/file to South Coast AQMD | **NOT IMPLEMENTED** |

This is a **P0 source-of-truth discrepancy**. Until the migration is reviewed, applied, and tested, the product must not state that Rule 2202 records “now persist in the backend.”

Even after the migration is applied, the current mounted UI does not itself implement the employee-data validation engine, AVR/VMT calculation executor, or package-generation action. It primarily reads the records those future/adjacent processes would create.

---

## 7. Live Supabase institutional backend

### 7.1 Project status

Project: `Relay-Rider-RD`  
Project ref: `dzrqrqfxcihvufvyctbt`  
Region: `us-west-2`  
Database: PostgreSQL 17  
Observed project status on 2026-08-16: `ACTIVE_HEALTHY`

### 7.2 Verified deployed schema

The following institutional/evidence objects were verified in the live database with RLS enabled:

- `organizations`
- `organization_members`
- `organization_sites`
- `cohorts`
- `tdm_programs`
- `data_sources`
- `organization_onboarding`
- `ingestion_runs`
- `ingestion_rows`
- `participant_roster_entries`
- `commute_observations`
- `operational_tasks`
- `commuter_needs`
- `planned_routes`
- `access_points`
- `match_previews`
- `administrative_reviews`
- `evidence_baselines`
- `evidence_observation_periods`
- `evidence_commute_observations`
- `evidence_validation_issues`
- `evidence_metric_values`

### 7.3 Verified deployed server functions

The live project contains callable functions for, among others:

- `create_organization_with_owner`
- `import_cohort_roster`
- `import_commute_records`
- `get_corridor_intelligence`
- `generate_deterministic_match_previews`
- `get_match_preview_admin_queue`
- `get_participant_directory`
- `get_organization_audit_events`
- `lock_evidence_baseline`

These functions being deployed means the backend has more capability than the current default admin UI exposes.

### 7.4 Current live data state

Aggregate-only database inspection found:

```text
organizations                   3
organization_sites              0
cohorts                         0
tdm_programs                    0
data_sources                    0
ingestion_runs                  0
commute_observations            0
operational_tasks               0
evidence_baselines              0
evidence_commute_observations   0
evidence_metric_values          0
commuter_needs                  0
planned_routes                  0
access_points                   0
match_previews                  0
administrative_reviews          0
```

Therefore the live backend is currently a **deployed institutional schema with essentially no operational program dataset in these audited tables**. Do not describe the backend as having demonstrated real corridor matching, participant operations, baseline measurement, or program outcomes.

---

## 8. Operational engine backend

The live backend contains a substantial institutional operating model even though the current default UI does not expose it end-to-end.

### 8.1 Roster and commute ingestion — **BACKEND-LIVE / UI-DORMANT**

The deployed schema supports:

- ingestion run provenance;
- original and normalized row storage;
- row-level validation status;
- participant roster entries using hashed external references;
- cohort membership;
- commute observations with approximate zones;
- travel days and time windows;
- flexibility;
- commute mode;
- parking difficulty;
- Access Point willingness;
- EV/hybrid status;
- operational review tasks.

Deployed RPC functions exist for cohort-roster and commute-record imports.

The current default admin UI does not provide the complete import workflow, so this must be described as backend capability, not a finished customer workflow.

### 8.2 Corridor intelligence — **BACKEND-LIVE / UI-DORMANT**

`get_corridor_intelligence` aggregates imported commute observations and authenticated commuter needs by approximate origin and destination zones. It can return:

- signal count;
- imported vs authenticated signal counts;
- parking-pressure count;
- Access Point interest count;
- EV/hybrid interest count;
- travel days;
- average parking difficulty;
- latest signal time.

A minimum group size is enforced by the function argument, which supports privacy-conscious aggregation.

No live commute records currently exist, so there is no real corridor output to claim.

### 8.3 Deterministic match previews — **BACKEND-LIVE / UI-DORMANT**

`generate_deterministic_match_previews` is deployed. It matches active commuter needs to active planned routes when they share:

- organization;
- approximate origin zone;
- approximate destination zone;
- at least one travel day;
- available planned-route capacity;
- compatible EV preference;
- non-conflicting time window.

The current deterministic-v1 score uses modeled factors including shared days, time fit, Access Point preference, EV/hybrid preference, and contribution compatibility.

Important guardrail built into the generated explanation:

```text
match preview only; administrative review required; no transportation is guaranteed
```

**Routing is not connected.** The engine explicitly records detour as not calculated. Therefore a generated preview is not evidence of geographic route overlap beyond the same approximate origin/destination-zone convention, and it cannot truthfully report a calculated detour.

With zero live commuter needs and zero planned routes, this capability has not produced an operational live match in the audited database.

---

## 9. PCC evidence engine

### 9.1 Public PCC evidence dashboard — **SPECIAL-VIEW / LIVE-REACHABLE**

Route: `?view=pcc-evidence`

The public evidence dashboard:

- fetches Pasadena ACS 2024 5-Year commute context;
- labels evidence class, source, vintage, geography, methodology, limitations, sample/universe, refresh time, and comparability;
- shows PCC institutional metrics as unavailable until PCC-specific records exist;
- refuses to infer PCC VMT or emissions from Pasadena resident context;
- distinguishes official estimate, institution supplied, participant reported, Relay Rider observed, Relay Rider modeled, and unavailable evidence.

This is currently one of the strongest evidence-discipline surfaces in the product.

### 9.2 Authenticated evidence workbench — **SPECIAL-VIEW / LIVE-PERSISTED, NOT YET EXERCISED WITH LIVE DATA**

Route: `?view=pcc-evidence-workbench`

The code implements:

```text
Sign in
  -> choose organization/site/cohort
  -> create draft evidence baseline
  -> upload CSV locally in browser
  -> map fields
  -> normalize rows
  -> validate rows
  -> preview research metrics
  -> explicitly exclude blocking rows when chosen
  -> insert validated observations + validation log
  -> lock baseline
```

The required evidence tables and `lock_evidence_baseline` function are present in the live Supabase project.

Validation logic presently checks, among other things:

- missing participant ID;
- invalid date format;
- unknown commute mode;
- negative distance;
- missing motor-vehicle distance;
- invalid carpool/vanpool occupancy;
- remote/on-site conflicts;
- duplicate participant/date rows;
- warning on non-zero distance for remote days.

The UI clearly labels its weekly VMT preview as a preliminary research convention rather than verified AQMD output.

**Audit limitation:** the live evidence tables contain zero rows. This audit verified code + deployed schema, not a successful production import using a real institution dataset. Therefore this is not yet an observed institutional E2E success.

---

## 10. Commuter-facing research beta

Repository: `relay-rider-beta-001`

### 10.1 Active screen graph — **PROTOTYPE-SESSION**

The public app defaults to Home and exposes interactive screens including:

- Home
- role selection
- commuter matches
- commute options
- corridor map
- commute activity
- profile
- commuter onboarding
- EV/hybrid planned-route registration
- privacy center
- security center
- review gates
- Green Route Wallet onboarding
- wallet
- partner console preview
- participant trip journey demo
- planned-route participant trip journey demo

The screen graph is real interactive React code, not screenshots.

### 10.2 Commuter need intake — **PROTOTYPE-SESSION**

The onboarding flow collects:

- campus;
- approximate starting area;
- recurring travel days;
- arrival time and flexibility;
- transit/mode preferences;
- planned-route interest;
- EV/hybrid preference;
- comfortable walking time;
- transit-pass status;
- incentive interests;
- adult confirmation;
- research consent.

On completion it creates a `RouteSignal` and a pending Green Route Credit in React context.

### 10.3 Persistence boundary — **PROTOTYPE-SESSION**

This is critical: the commuter app does **not** write these signals to the live institutional Supabase backend.

`AppContext` holds user profile, route signals, EV participant signals, and Green Route Credits in React state. Its declared storage mode is:

```text
session-memory
```

Earlier persisted sensitive browser data is cleared at startup. Refreshing/restarting the prototype loses the active in-memory state.

The beta repository README explicitly states that its Supabase directory is a backend blueprint and must not be treated as deployed until separately reviewed/applied/tested.

### 10.4 Commute options and matches — **PROTOTYPE-SESSION / MODELED**

The commuter beta can present ranked planned-route and local-transit options and explain modeled fit. It is not querying the live deterministic match engine described in Section 8.

Therefore:

- commuter-visible match cards are prototype outputs;
- they are not evidence of a live institutional match record;
- transit examples require operator verification;
- a displayed score does not demonstrate a live route computation;
- a displayed planned-route option is not a guaranteed trip.

### 10.5 Corridor map — **PROTOTYPE-SESSION / PUBLIC MAP DATA**

The app uses Leaflet/OpenStreetMap and public locations/EV infrastructure for its corridor experience. Candidate Access Points remain research signals and are not institutionally approved merely because they appear on the map.

### 10.6 Green Route Wallet — **PROTOTYPE-SESSION**

Credits can be represented in the participant UI and accumulated in the in-memory context. There is no verified institution-funded production ledger or redemption integration in this commuter runtime.

### 10.7 Trip journey — **INTERACTIVE DEMONSTRATION**

The prototype includes participant and planned-route-participant journey states from coordination confirmation through Access Point arrival and completion.

This is a simulated state journey. It is **not**:

- GPS trip tracking;
- live dispatch;
- live driver status;
- a transportation confirmation system;
- payment settlement;
- proof that a route operated.

---

## 11. What works end-to-end today

The strict answer is narrower than the product architecture.

### Flow A — Public institutional evidence exploration

```text
Load institutional workspace
  -> inspect Pasadena public context
  -> navigate admin sections
  -> open evidence dashboard
  -> inspect source/provenance/evidence classes
```

**State:** LIVE-REACHABLE.

### Flow B — Authenticated evidence-baseline workflow

```text
Authenticate
  -> select organization/site/cohort
  -> create evidence baseline
  -> upload and map CSV
  -> normalize + validate in browser
  -> persist valid observations and issue log
  -> lock baseline
```

**State:** LIVE-PERSISTED by code + verified live schema, but not yet proven with a populated live institutional dataset in this audit.

### Flow C — Operational commute-data engine

```text
Roster/commute import RPC
  -> normalized commute observations
  -> corridor aggregation
  -> deterministic match-preview generation
  -> admin review queue
```

**State:** BACKEND-LIVE / UI-DORMANT. Server objects are deployed; default UI does not expose the full flow; live tables are empty.

### Flow D — Commuter research experience

```text
Home
  -> submit commute need or EV/hybrid planned route
  -> receive prototype options/matches
  -> explore map/wallet/activity
  -> run trip-state demonstration
```

**State:** PROTOTYPE-SESSION. Interactive, but no institutional persistence or live operational activation.

### Flow E — Rule 2202 persistence

```text
Rule 2202 screen
  -> authenticate
  -> create year
  -> population
  -> pathway
  -> validation
  -> metrics
  -> package
```

**State:** BLOCKED. The current live database is missing the Rule 2202 persistence migration. Calculation and package-generation execution are also incomplete in the mounted UI.

---

## 12. Explicit negative capability register

The following must not be described as live based on the audited code/deployment:

- live ride booking;
- nearest-driver assignment;
- live dispatch;
- instant pickup;
- guaranteed transportation;
- live GPS trip operations;
- automatic route activation;
- automatic commuter payments;
- guaranteed earnings;
- production Green Route Credit redemption;
- live routing/detour calculation in deterministic matching;
- automatic AQMD Rule 2202 filing;
- AQMD certification or approval;
- completed Rule 2202 compliance package generation;
- validated parking reduction;
- validated VMT reduction;
- validated emissions reduction;
- certified carbon offsets;
- live PCC institutional baseline;
- live corridor participation results;
- institutionally approved Access Points unless separately documented;
- integrated commuter-to-admin production workflow.

---

## 13. Automated verification posture

### `relay-mock-v3`

Build command:

```text
npm run build
= tsc && vite build && node scripts/prepare-sites-build.mjs
```

The repository includes Playwright runtime tests and static Sites worker tests.

Current GitHub CI runs:

```text
npm ci
npm audit --audit-level=high
npm run build
npm run test:sites
```

The CI workflow does **not** currently run the Playwright `test:runtime` suite, and the audited latest commit did not return a verified current combined status in this review. Therefore this document does not claim that every current main-branch workflow is green.

### `relay-rider-beta-001`

The beta repository provides build/type/security scripts, but this audit did not establish a production-grade E2E suite proving participant-to-backend persistence because that backend connection does not exist in the current app.

---

## 14. Security and governance observations

The live institutional tables inspected in this audit have RLS enabled. The schema contains tenant-role helpers, audit-event support, and role-specific policies.

However, a 2026-08-16 Supabase security-advisor review still reports open warnings, including SECURITY DEFINER exposure review items and disabled leaked-password protection. A separate security assessment should determine which warnings are intentional and which require remediation.

This document does not certify the system as secure, compliant, or production-ready.

---

## 15. P0/P1 engineering gaps revealed by this audit

### P0 — Correct Rule 2202 deployment drift

The default UI claims persistent Rule 2202 records while the live database lacks the required tables. Resolve by either:

1. reviewing/applying/testing the migration, or
2. reverting the UI claim and disabling persistence controls until backend deployment is complete.

### P0 — Establish immutable deployment provenance

For each public environment record:

- environment URL;
- repository;
- branch;
- commit SHA;
- build/run ID;
- deployment timestamp;
- backend project/ref;
- database migration head;
- smoke-test result.

Without this, “deployed code” can only be inferred from source branches.

### P0 — Connect or explicitly separate commuter and institutional systems

Today the commuter beta is session-memory while the institutional backend has persisted commuter/route tables. Decide whether the beta becomes the controlled participant client of that backend. Until then they are separate systems.

### P1 — Restore/replace an operational admin UI over deployed backend capabilities

Roster import, commute import, corridor intelligence, deterministic match generation, and admin review functions are deployed but not exposed by the default admin runtime.

### P1 — Put critical E2E tests into CI

At minimum test:

1. authentication + tenant isolation;
2. organization/site creation;
3. evidence CSV import + invalid-row behavior + baseline lock;
4. roster import provenance;
5. commute import validation;
6. corridor aggregation privacy threshold;
7. deterministic match fixture;
8. negative cross-tenant access;
9. Rule 2202 persistence after migration;
10. disabled/nonexistent submission and payment actions remain disabled.

### P1 — Create real routing provenance before showing detour

The live deterministic engine correctly admits that routing is not connected. Any future detour minutes/miles must carry provider, request version/time, route inputs, and failure state.

---

## 16. Release evidence packet

A release cannot move a capability to “LIVE” merely because a PR merged. Each release should produce:

```text
release/
  DEPLOYMENT.json
  CAPABILITY_MATRIX.md
  MIGRATION_HEAD.txt
  E2E_RESULTS.md
  SECURITY_CHECKS.md
  DATA_PROVENANCE.md
  KNOWN_LIMITATIONS.md
```

Minimum `DEPLOYMENT.json` fields:

```json
{
  "environment": "production|demo|research-beta",
  "url": "...",
  "repository": "owner/repo",
  "commit_sha": "...",
  "built_at": "ISO-8601",
  "deployment_id": "...",
  "supabase_project_ref": "...",
  "database_migration_head": "...",
  "verified_by": "human|CI",
  "smoke_test": "pass|fail|not_run"
}
```

---

## 17. Capability promotion rule

A feature may be promoted only when all required evidence exists.

| Claim | Required evidence |
|---|---|
| “Built” | code merged and reachable |
| “Deployed” | exact hosting deployment bound to commit SHA |
| “Persistent” | live backend object + successful write/read test |
| “Tenant-secure” | RLS/policy inspection + negative cross-tenant test |
| “End-to-end” | browser/API test traverses the complete user workflow |
| “Operational” | end-to-end workflow works against intended environment with real program configuration |
| “Validated” | agreed methodology + representative data + acceptance criteria + reviewed results |
| “Partner-ready” | operational evidence plus product-state/caveat review |

No lower evidence level may be described using a higher-level claim.

---

## 18. Current engineering conclusion

Relay Rider is **not just a static mockup**. The live Supabase project contains a real multi-tenant institutional data model, RLS, ingestion structures, evidence structures, corridor-intelligence functions, deterministic match-preview functions, and audit-oriented objects.

At the same time, Relay Rider is **not yet one integrated production platform**. The current commuter app is session-memory only; the default admin UI exposes only part of the deployed operational backend; the Rule 2202 UI is ahead of the live database migration state; and audited operational tables are empty.

The most accurate current description is:

> **Relay Rider is a research-beta institutional TDM software system with a deployed multi-tenant Supabase backend, a partially connected institutional admin/evidence runtime, a deployed but UI-dormant operational corridor/match engine, and a separate interactive commuter prototype that does not yet persist participant state to the institutional backend.**

That statement should remain the engineering baseline until the next audited release.

---

## 19. Maintenance protocol

Update this file whenever any of the following changes:

- active runtime entrypoint;
- public deployment;
- Supabase project;
- migration head;
- commuter persistence model;
- default admin navigation;
- matching/scoring methodology;
- routing provider;
- Rule 2202 workflow;
- report generation;
- incentives ledger;
- security/RBAC model;
- E2E test coverage.

Every update must:

1. pin new commit SHA(s);
2. inspect the live database rather than assuming migrations applied;
3. update the capability state table;
4. record newly working and newly broken negative capabilities;
5. attach or reference release test evidence;
6. preserve the distinction between observed, calculated, modeled, prototype, and unavailable behavior.
