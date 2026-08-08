# Relay Rider SaaS TDM Product Model

## Product hierarchy

Relay Rider is the institutional Transportation Demand Management operating platform.

- **Relay Rider SaaS Platform** — institution-facing system of record and operating environment.
- **Corridor Exchange** — governed planned-route coordination and commuter-option module inside Mobility.
- **Participant App** — commuter-facing extension of an institution-sponsored program.

Relay Rider is not a taxi, transportation network company, live dispatch service, instant-pickup system, guaranteed transportation service, or unrestricted public marketplace.

## Institutional operating cycle

Measure → Diagnose → Plan → Coordinate → Administer → Engage → Measure Outcomes → Report

The implementation spine remains:

Signal → Record → Score → Preview → Task → Review → Dashboard → Report → Partner Action

## Primary SaaS navigation

### Dashboard
- Executive Dashboard

### Intelligence
- Baseline
- Sites
- Corridors
- Parking
- EV & Charging
- Mobility Map

### Mobility
- Commute Options
- Transit & Mobility
- Corridor Exchange
- Access Points

### Programs
- TDM Programs
- Incentives
- Engagement

### Operations
- Participants
- Administrative Review Queue
- Program Rules

### Measure
- Measurement
- Reports
- Exports

### Settings
- Organization Settings
- Sites and cohorts
- Roles and permissions
- Privacy and retention
- Data-source configuration

## Multi-tenant data model target

Production should scope records through:

organization → sites → cohorts → participants → commute signals → baseline conditions → corridors → mobility options → programs → interventions → participation events → outcomes → reports

The Corridor Exchange remains a governed subsystem:

commuter needs + planned routes → match previews → administrative reviews

Production RBAC should support roles such as Organization Owner, Program Administrator, TDM / ETC Manager, Sustainability Manager, Site Manager, Analyst, Reviewer, and Participant.

## Data boundaries

Institutional demonstration values must remain labeled as Demonstration data, Modeled example, Simulated, Estimated, or Prototype as appropriate.

Participant exact home locations should not be exposed in institutional views. Approximate zones are the default planning geography.

Rule 2202 functionality should remain reporting-readiness/support tooling until calculations and regulatory workflow are formally validated. Do not imply automated filing.

Green Route Credits are promotional or employer-sponsored participation benefits and must not be described as wages, fares, cash earnings, certified carbon offsets, utility credits, LCFS credits, or guaranteed benefits unless formally established.
