# Relay Rider Map Data Source Registry

Status: product prototype / demonstration environment

Corridor: Pasadena ↔ Eagle Rock ↔ Glendale

This registry exists so every map layer can be traced to a source and clearly classified as **public source**, **institution-supplied**, **observed**, **synthetic**, **calculated**, or **modeled**. A map pin does not imply partnership, property permission, Access Point designation, pickup approval, safety certification, or transportation availability.

## Layer registry

| Layer / feature | Current use | Source / provenance | Classification | Refresh rule | Product implication |
|---|---|---|---|---|---|
| Base map tiles | Geographic context | OpenStreetMap contributors via Leaflet tile layer | Public source | Provider-controlled | Geographic context only; maintain attribution |
| Pasadena–Eagle Rock–Glendale corridor line | Prototype corridor visualization | Relay Rider internal modeled corridor geometry | Modeled | Review when corridor scope changes | Must remain labeled as modeled; not a guaranteed route |
| Glendale Transportation Center | Transit / corridor anchor | City / transit public location data; verify against current official agency source before external reporting | Public source / research anchor | Quarterly or before partner use | No Access Point designation implied |
| Eagle Rock Plaza public edge | Candidate meeting-area context | Relay Rider research-stage candidate; property/site status not approved | Synthetic / research candidate | Re-review before any partner use | Administrative/site suitability review required |
| Memorial Park Station | Transit anchor | LA Metro official station/service information | Public source / research anchor | With GTFS/service updates | Can support multimodal preview context; no pickup approval implied |
| Del Mar Station | Transit anchor | LA Metro official station/service information | Public source / research anchor | With GTFS/service updates | Can support multimodal preview context; no pickup approval implied |
| Pasadena City College | Institution destination anchor | Pasadena City College official location information: https://pasadena.edu/about/directions.php | Public source / institution anchor | Annual or before partner use | Campus rules apply; no partnership implied |
| Caltech | Institution anchor | Caltech official location information: https://www.caltech.edu/about/visit/directions | Public source / institution anchor | Annual or before partner use | Research context only; no partnership implied |
| Huntington Hospital | Healthcare anchor | Huntington Health official location information: https://www.huntingtonhealth.org/contact-us/directions-parking/ | Public source / institution anchor | Annual or before partner use | Research context only; no pickup approval implied |
| Glendale Community College | Institution anchor | Glendale Community College official location information: https://www.glendale.edu/about-gcc/locations.html | Public source / institution anchor | Annual or before partner use | Research context only; no partnership implied |
| Commuter demand heat / clusters | Future dashboard/map layer | Commuter Need Intake + institution-supplied records | Observed when real; synthetic in demo | Per reporting period | Must show sample size, period, and privacy threshold |
| Planned-route availability | Future dashboard/map layer | Planned Route Registration | Observed when real; synthetic in demo | Per reporting period | Represents planned-route signals, not guaranteed transportation |
| Parking pressure | Future analytical layer | Institution-supplied parking data + commuter survey inputs + public context | Observed / calculated / modeled depending input | Per reporting period | Methodology and confidence must be visible |
| EV/hybrid participation | Future analytical layer | Commuter / planned-route intake | Observed when real; synthetic in demo | Per reporting period | Do not infer EV ownership from geography |
| Charging-interest signal | Future analytical layer | Opt-in commuter intake / institution data | Observed / modeled | Per reporting period | Directional planning signal; not charger engineering recommendation |
| Access Point candidates | Candidate coordination layer | Relay Rider research + institution/site review | Research candidate until approved | Review before each partner use | Use Candidate → Under Review → Designated → Rejected states |

## Required provenance fields

Every new geographic dataset should store or document:

- `source_name`
- `source_url`
- `source_type`
- `effective_date`
- `retrieved_at`
- `classification` — Public Source / Institution-Supplied / Observed / Synthetic / Calculated / Modeled
- `confidence`
- `license_or_display_notes`
- `privacy_treatment`
- `review_status`
- `review_owner`

## Privacy rules

1. Use approximate zones before precise locations.
2. Do not display individual home coordinates on partner-facing maps.
3. Apply aggregation/suppression thresholds before showing sparse demand clusters.
4. Separate commuter-facing and administrator-facing location detail.
5. Do not reveal precise route information beyond the minimum needed for an approved workflow.
6. Treat accessibility and privacy preferences as restricted administrative data.

## Access Point governance

A candidate location should not be displayed as institutionally designated until review covers, at minimum:

- public visibility and general suitability
- lighting observations
- accessibility observations
- route compatibility and detour impact
- property/site restrictions
- institution/site permission where applicable
- current review owner and status

Relay Rider does not guarantee safety or suitability.
