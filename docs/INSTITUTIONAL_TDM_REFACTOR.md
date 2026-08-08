# Relay Rider Institutional TDM Refactor

## Product architecture

This refactor preserves the existing participant research-beta and adds a role-aware institutional demonstration workspace.

### Layer 1 — Mobility Intelligence
- Commute Demand Overview
- Corridor Opportunity Detection
- Parking Intelligence
- EV / Hybrid Corridor Analysis
- Interactive mobility map

### Layer 2 — Corridor Exchange
- Multimodal option comparison
- Demo commute-need records
- Demo planned-route records
- Explainable simulated Match Previews
- Proposed-contribution state transitions
- Access Point review

### Layer 3 — Program Console
- Participant / cohort hierarchy
- Administrative Review Queue
- Green Route Credit scenario configuration
- Program Rules
- Reporting Center
- Commute Activity Ledger with functioning demo CSV export
- Administrative role switching

## Operating spine

SIGNAL → RECORD → SCORE → PREVIEW → TASK → REVIEW → DASHBOARD → REPORT → PARTNER ACTION

## Data boundaries

The participant research-beta remains connected to Supabase and is not seeded with fake participant records. Institutional views use clearly labeled DEMO DATA, MODELED, ESTIMATED, or SIMULATED records. They do not imply that Pasadena City College, Caltech, Glendale Community College, hospitals, or municipalities are Relay Rider customers, partners, or pilots.

## Operational guardrails

- No live dispatch
- No instant pickup
- No guaranteed transportation
- No automatic payment
- No guaranteed earnings
- No unrestricted public marketplace
- Planned routes represent trips participants already intend to make
- Proposed contributions remain willingness-to-contribute / participation signals
- Match previews remain subject to program rules and administrative review
- Rule 2202 is presented as reporting readiness, not filing/submission
- Access Points are candidates/reviewed/designated locations and are never described as guaranteed safe

## Functional prototype interactions

- Switch between institutional and participant views
- Switch demonstration administrative roles
- Navigate all top-level architecture groups
- Select parking facilities and model intervention scenarios
- Configure Green Route Credit budget, cap, behavior, and approval requirement
- Select simulated commuter-option previews and inspect explanatory factors
- Express simulated route interest and request administrative review
- Accept/decline demonstration review-queue items
- Filter Commute Activity Ledger records
- Export visible DEMO ledger records to CSV
- Open the real Leaflet map with demand, planned-route, Access Point, parking, EV, transit, and institution layers

## Remaining engineering debt

- Institutional console uses local demonstration state; production organization data must come from authenticated Supabase organization/site/cohort records.
- Match Preview Engine is explainable but simulated; route geometry, time-window scoring, detour calculations, and eligibility must be computed from real eligible records.
- Demo parking, intervention, incentive, and sustainability metrics require source-backed calculation pipelines before operational use.
- Production role switching must be replaced by authenticated role-based access control.
- Messaging is explicitly a preview and is not functional.
- Rule 2202 calculations and filing workflows require regulatory validation before compliance use.
