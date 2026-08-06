# Relay Rider Map Participant Layers

## Status

**Document type:** Product and engineering requirements  
**Product state:** Product prototype / demonstration environment  
**Operational status:** Planning specification. This document does not imply that live participant tracking, operational routes, or guaranteed commuter options are active.

## Purpose

The Relay Rider corridor map must include more than transit stops, Access Point candidates, institutions, parking facilities, and EV charging stations. It must also represent the two participant-side signals that make the map useful for an institution-funded commuter program:

1. **EV/hybrid planned-route participants** — adults who register trips they already intend to make.
2. **Commuters seeking options** — adults who submit commute needs, time windows, Access Point willingness, and other program preferences.

The map should combine these participant signals with GTFS, charging, institutional, parking, and corridor data to show where compatible commuter options may exist, where demand is unmatched, and where an institution could improve participation through Access Points, incentives, schedule changes, or outreach.

The map is not a live-dispatch screen, nearest-driver interface, public people tracker, instant-pickup product, or guaranteed transportation service.

---

## 1. Map Layer Model

The map should support the following independent layers:

### Public and infrastructure layers

- GTFS transit stops and stations
- Transit routes and route shapes
- Published service windows
- GTFS-Realtime service alerts and delay overlays, when available
- EV charging stations and charging ports
- Campuses, hospitals, employer sites, civic destinations, and other institutions
- Parking facilities and parking-pressure indicators
- Access Point candidates
- Reviewed or institutionally designated Access Points
- Corridor boundaries and generalized origin/destination zones

### Participant layers

- Aggregated commuter-demand zones
- Aggregated planned-route supply
- EV/hybrid planned-route corridors
- Commuter time-window clusters
- Access Point willingness
- EV/hybrid preference
- Accessibility-request counts
- Unmatched commuter demand
- Potential low-detour route overlap
- Institution or cohort participation

Participant layers must default to aggregated or generalized views. Exact participant locations, identities, complete schedules, and detailed route geometries must not be exposed on public or general administrator maps.

---

## 2. EV/Hybrid Planned-Route Participant Layer

### Product meaning

An EV/hybrid planned-route participant is an adult program participant who registers a route they already intend to travel. Registration is a planning signal and does not imply that the route will operate, that another commuter will be accepted, or that compensation will occur.

### Required intake fields

The planned-route registration should support:

- General origin zone
- General destination zone
- Recurring days
- Departure or arrival time window
- Schedule flexibility
- Vehicle type
- EV/hybrid status
- Available capacity
- Maximum detour time
- Maximum detour distance, when collected
- Preferred Access Points
- Access Point willingness
- Accessibility capabilities or limitations, when voluntarily provided
- Institution or cohort membership
- Privacy setting
- Verification willingness
- Administrative-review status
- Contribution-review preference, if the program uses proposed contributions

### Map representation

The default institutional map should not display a participant's exact route. It should display one or more of the following generalized representations:

- Corridor band
- Origin-zone-to-destination-zone flow
- Hexagonal or grid-based route-density surface
- Aggregated directional arrow
- Time-filtered supply count
- Access Point compatibility count
- EV/hybrid supply count by corridor

### Example layer label

> 14 EV/hybrid planned-route registrations overlap this corridor on Tuesdays between 7:00 and 9:00 a.m.

### Planned-route detail card

A corridor or zone selection may show:

- Number of planned-route registrations
- EV count
- Hybrid count
- Typical available capacity range
- Median or distribution of maximum detour tolerance
- Common travel days
- Common time windows
- Compatible Access Point candidates
- Verification-readiness count
- Administrative-review count
- Data freshness

The detail card should not reveal participant names, exact home locations, license plates, exact start points, or personally identifying route details.

---

## 3. Commuter Need Layer

### Product meaning

A commuter need is a participant-submitted signal describing a recurring commute requirement. It is not a booking, transportation purchase, or guaranteed request fulfillment.

### Required intake fields

The commuter need intake should support:

- General origin zone
- General destination zone
- Days of travel
- Arrival or departure time window
- Schedule flexibility
- Current commute mode
- Parking difficulty
- Access Point willingness
- Preferred or acceptable Access Points
- EV/hybrid preference
- Accessibility preference or request
- Privacy setting
- Institution or cohort membership
- Proposed contribution, when enabled
- Program consent and data-use acknowledgment

### Map representation

The commuter layer should use aggregated representations such as:

- Demand heatmap
- Origin-zone clusters
- Destination-zone clusters
- Directional flow bands
- Time-window demand counts
- Access Point willingness percentage
- Unmatched-demand markers
- Parking-pressure overlay
- EV/hybrid preference overlay

A general administrator should not see exact residences or a single participant's complete recurring schedule.

### Example layer label

> 43 commuters originate in this generalized zone. Twenty-six require arrival between 7:30 and 8:30 a.m.; 18 indicated willingness to use a reviewed Access Point.

### Commuter-demand detail card

A selected zone may show:

- Total commuter needs
- Primary destination zones
- Time-window distribution
- Flexibility distribution
- Current commute-mode distribution
- Parking-difficulty distribution
- Access Point willingness
- EV/hybrid preference
- Accessibility-request count
- Planned-route coverage
- Transit coverage
- Unmatched-demand reasons
- Data freshness and sample-size warning

---

## 4. Participant-to-Infrastructure Analysis

The map should connect participant demand and planned-route supply to infrastructure without implying an operational match.

### EV charging analysis

For each corridor, calculate or model:

- EV/hybrid planned routes passing near charging stations
- Charging stations near common origin or destination zones
- Charging stations near Access Point candidates
- Charger type and port count where available
- Public, restricted, workplace, campus, or partner access classification
- Charging access hours where available
- Data-source freshness
- Potential charging-demand concentration

A charging station should not be represented as available, operational, free, or institutionally approved unless the source data and review status support that statement.

### Transit analysis

For each participant cluster, calculate or model:

- Distance to transit
- Scheduled service during the requested time window
- First-mile and last-mile gaps
- Transfer count
- Service-gap periods
- Whether a planned route could complement transit
- Whether a reviewed Access Point connects planned routes with transit

### Institutional analysis

For each institution or cohort, calculate or model:

- Commuter demand by zone and time window
- Planned-route supply by zone and time window
- EV/hybrid participation
- Access Point willingness
- Parking pressure
- Transit coverage
- Unmatched-demand reasons
- Potential incentive need
- Potential outreach areas

---

## 5. Compatibility Preview Layer

The map may show potential compatibility between commuter needs and planned routes, but it must not present a guaranteed ride.

### Compatibility inputs

Potential commuter options may consider:

- Origin-zone compatibility
- Destination-zone compatibility
- Route overlap
- Days of travel
- Time-window fit
- Schedule flexibility
- Estimated detour time
- Estimated detour distance
- Access Point compatibility
- EV/hybrid preference
- Accessibility needs
- Privacy settings
- Institution or cohort eligibility
- Proposed-contribution compatibility
- Program rules
- Administrative-review status

### Map output

When a commuter need or corridor is selected, the map may show:

- Compatible planned-route count
- Potential Access Point pairs
- Estimated route-overlap band
- Estimated detour range
- Time-window fit
- EV/hybrid indicator
- Transit complement indicator
- Administrative-review requirement
- Why each commuter option appeared

### Example explanation

> This commuter option appeared because an EV planned route overlaps the Pasadena–Glendale corridor, reaches a reviewed Metro-connected Access Point, fits the selected 7:30–8:15 a.m. arrival window, and produces a low estimated detour.

### Required disclaimer

> This is a simulated commuter option in a product prototype. A proposed contribution is not a confirmed fare or transportation purchase. Options do not guarantee acceptance or route operation and may require administrative review.

---

## 6. Privacy and Anti-Surveillance Requirements

The participant map must be designed as a mobility-intelligence tool, not a person-tracking system.

### Default protections

- Use general zones before exact locations.
- Aggregate participant counts before map display.
- Apply minimum cohort thresholds before showing a zone or route-density cell.
- Suppress low-count cells that could identify individuals.
- Do not show names, profile photos, contact information, or exact home locations on analytical maps.
- Do not show exact recurring schedules on general administrator maps.
- Do not show live participant locations.
- Do not expose precise planned-route geometry until a governed workflow requires it.
- Separate commuter, planned-route participant, and administrator views.
- Log administrative access to sensitive location data.
- Enforce role-based permissions.
- Support withdrawal, correction, retention, and deletion workflows.

### Recommended display thresholds

The exact thresholds should be configurable by program and privacy review. Initial prototype defaults may include:

- Minimum five participants before displaying a demand cell
- Minimum three planned-route registrations before displaying a supply corridor
- Time windows grouped into 30- or 60-minute bands
- Origin and destination displayed as zones, not addresses
- Low-count accessibility data shown only as a protected aggregate

These are prototype defaults, not legal determinations. Privacy counsel and institutional program rules may require stricter thresholds.

### Precise-location access

Precise data should be limited to explicitly authorized workflows such as:

- Participant self-view
- Administrative review of a specific submitted option
- Access Point planning with a documented need
- Incident review under established procedures
- Controlled beta operations after applicable approvals

Precise-location access should never be required for a public dashboard.

---

## 7. Role-Based Map Views

### Public or demonstration view

May show:

- Transit
- EV charging
- Institutions
- Parking
- Corridor boundaries
- Access Point candidates
- Simulated demand heatmaps
- Simulated planned-route bands
- Modeled analytics

Must clearly label simulated data and avoid suggesting live participation.

### Commuter view

May show:

- The participant's own generalized commute need
- Candidate Access Points
- Transit options
- Charging context where relevant
- Compatible commuter-option previews
- Explanation of why options appeared
- Administrative-review status

Should not show other participants' identities or exact routes.

### Planned-route participant view

May show:

- The participant's own registered route
- Generalized commuter-demand clusters
- Candidate Access Points
- Estimated detour impacts
- Compatible commuter-option previews
- Administrative-review status

Should not reveal commuter identities or exact residential locations.

### Program administrator view

May show:

- Aggregated demand and supply
- Corridor and time-window analytics
- Access Point candidates and review statuses
- EV/hybrid participation
- Transit and charging coverage
- Unmatched-demand reasons
- Incentive scenarios
- Administrative review queue

Detailed participant records should require a separate governed review action rather than appearing automatically on the map.

---

## 8. Database Additions

### `commuter_needs`

Suggested fields:

- `id`
- `participant_id`
- `institution_id`
- `cohort_id`
- `origin_zone_id`
- `destination_zone_id`
- `travel_days`
- `time_window_start`
- `time_window_end`
- `schedule_flexibility_minutes`
- `current_commute_mode`
- `parking_difficulty`
- `access_point_willingness`
- `ev_hybrid_preference`
- `accessibility_preference`
- `privacy_setting`
- `proposed_contribution`
- `administrative_review_status`
- `active`
- `created_at`
- `updated_at`

### `planned_routes`

Suggested fields:

- `id`
- `participant_id`
- `institution_id`
- `cohort_id`
- `origin_zone_id`
- `destination_zone_id`
- `travel_days`
- `time_window_start`
- `time_window_end`
- `schedule_flexibility_minutes`
- `vehicle_type`
- `ev_hybrid_status`
- `available_capacity`
- `maximum_detour_minutes`
- `maximum_detour_distance_meters`
- `privacy_setting`
- `verification_willingness`
- `verification_status`
- `administrative_review_status`
- `active`
- `created_at`
- `updated_at`

### `participant_access_point_preferences`

Suggested fields:

- `id`
- `participant_id`
- `commuter_need_id`
- `planned_route_id`
- `access_point_candidate_id`
- `preference_type`
- `willingness_level`
- `accessibility_notes_protected`
- `created_at`
- `updated_at`

### `commuter_demand_aggregates`

Suggested fields:

- `id`
- `zone_id`
- `destination_zone_id`
- `institution_id`
- `cohort_id`
- `service_date_group`
- `time_window_group`
- `commuter_count`
- `access_point_willing_count`
- `ev_hybrid_preference_count`
- `accessibility_request_count_protected`
- `parking_difficulty_summary`
- `transit_coverage_summary`
- `planned_route_coverage_summary`
- `suppressed_for_privacy`
- `calculated_at`

### `planned_route_aggregates`

Suggested fields:

- `id`
- `origin_zone_id`
- `destination_zone_id`
- `institution_id`
- `cohort_id`
- `service_date_group`
- `time_window_group`
- `planned_route_count`
- `ev_count`
- `hybrid_count`
- `available_capacity_total`
- `detour_tolerance_summary`
- `access_point_compatibility_summary`
- `verification_readiness_count`
- `suppressed_for_privacy`
- `calculated_at`

### `commuter_option_previews`

Suggested fields:

- `id`
- `commuter_need_id`
- `planned_route_id`
- `origin_access_point_candidate_id`
- `destination_access_point_candidate_id`
- `compatibility_score_internal`
- `route_fit_score_internal`
- `estimated_detour_minutes`
- `estimated_detour_distance_meters`
- `time_window_fit`
- `access_point_fit`
- `ev_hybrid_indicator`
- `transit_complement_indicator`
- `proposed_contribution_compatibility`
- `explanation_payload`
- `administrative_review_status`
- `prototype_only`
- `created_at`
- `expires_at`

Internal scores and weights must not be exposed in public-facing materials unless specifically approved.

---

## 9. Map Filters and Controls

The prototype should include controls for:

- Date or recurring day
- Time window
- Institution or cohort
- Corridor
- Transit agency
- Transit route
- EV only
- Hybrid included
- Commuter demand
- Planned-route supply
- Access Point willingness
- Parking difficulty
- Accessibility-data availability
- Charging-station type
- Public versus restricted charging
- Access Point review status
- Matched versus unmatched demand
- Realtime service disruption

A visible legend should distinguish infrastructure, modeled data, participant aggregates, simulated data, and reviewed program assets.

---

## 10. Institutional Dashboard Metrics

The participant-enabled map should feed the Program Dashboard with:

- Commuter demand by corridor and time window
- Planned-route availability by corridor and time window
- EV/hybrid participation rate
- Available planned-route capacity
- Demand-to-supply ratio
- Access Point willingness rate
- Access Point candidate utilization potential
- Transit coverage rate
- First-mile and last-mile gap rate
- Parking-difficulty concentration
- Unmatched demand by reason
- Estimated detour distribution
- Match-preview conversion
- Administrative-review backlog
- Estimated incentive required
- Charging proximity and charging-demand signals

All impact projections must be labeled estimated, modeled, directional, or scenario-based as appropriate.

---

## 11. Prototype Acceptance Criteria

The map revision is successful when:

1. A user can independently toggle transit, charging, institutions, Access Points, commuter demand, and planned-route supply.
2. EV/hybrid planned-route participants appear only as generalized or aggregated supply signals by default.
3. Commuters appear only as generalized or aggregated demand signals by default.
4. A corridor selection explains the relationship among demand, planned-route supply, transit, charging, parking pressure, and Access Points.
5. A commuter-option preview explains why it appeared.
6. Low-count participant data is suppressed or protected.
7. No screen suggests live participant tracking, nearest-driver assignment, instant pickup, or guaranteed transportation.
8. Candidate Access Points are clearly distinguished from reviewed or institutionally designated Access Points.
9. Exact participant locations are not visible in public or general administrator views.
10. The map can show unmatched demand and the reason it remains unmatched.
11. The map can distinguish real source data from simulated prototype data.
12. Realtime transit information is visibly timestamped and expires when stale.

---

## 12. Recommended First Demonstration

Use the Pasadena ↔ Eagle Rock ↔ Glendale corridor.

The first demonstration should include:

- GTFS transit stops and routes
- EV charging stations
- PCC, hospitals, employer centers, civic destinations, and parking facilities
- Access Point candidates
- Reviewed Access Point examples clearly labeled as prototype records
- Simulated commuter-demand zones
- Simulated EV/hybrid planned-route bands
- Morning and return time-window filters
- Parking-pressure indicators
- Transit service-gap analysis
- Potential commuter-option previews
- Administrative-review queue

The demonstration should make the institutional problem visible:

> Where are commuters coming from, when do they need to arrive, where does transit fail to fit their schedules, which planned EV/hybrid routes already overlap those corridors, and which reviewed Access Points could improve compatibility with limited detour?

That is the intended role of the Relay Rider map.