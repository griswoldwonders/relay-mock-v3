# Relay Rider GTFS Integration Architecture

## Status

**Document type:** Engineering architecture and product requirements  
**Product state:** Product prototype / demonstration environment  
**Operational status:** Planning specification; this document does not imply that live agency feeds, realtime transit data, or operational commuter options are currently active.

## Purpose

Relay Rider should use the General Transit Feed Specification (GTFS) as a transit-intelligence layer supporting institution-funded transportation demand management, Access Point analysis, planned-route coordination, explainable commuter-option previews, and corridor reporting.

GTFS should help Relay Rider understand how fixed-route transit intersects with commuter demand. It should not turn Relay Rider into a general-purpose trip planner, live dispatch platform, or guaranteed transportation service.

The canonical technical reference is the public `google/transit` repository and the GTFS documentation it maintains. GTFS consists of two related formats:

- **GTFS Schedule:** planned agencies, stops, routes, trips, stop times, calendars, transfers, pathways, and shapes.
- **GTFS Realtime:** service alerts, trip updates, vehicle positions, and predicted operational changes.

Agency GTFS feeds remain separate from the specification. Relay Rider must maintain an agency-feed registry containing the actual static ZIP and realtime endpoint information for each participating or analyzed transit provider.

---

## 1. Access Point Intelligence

Relay Rider should use GTFS stops and stations to identify **candidate Access Points** near:

- Campuses
- Hospitals
- Employer sites
- Civic destinations
- Parking facilities
- EV charging sites
- Planned commuter corridors

A GTFS stop or station is an **Access Point candidate**, not an automatically designated, approved, or guaranteed-safe meeting location.

Before an Access Point is presented as institutionally designated or approved, it should pass the applicable administrative review workflow, including:

- Public visibility and general suitability review
- Lighting and accessibility review
- Route compatibility review
- Property or site-rule review
- Institution or program approval where required
- Privacy and data-exposure review

### Candidate-generation logic

Candidate Access Points may be generated using:

1. Proximity to approximate origin or destination zones
2. Proximity to campuses, employer sites, hospitals, civic destinations, parking, and EV charging
3. Transit service frequency during relevant commute windows
4. Route and corridor compatibility
5. Walking-distance estimates
6. Transfer opportunities
7. Accessibility-related GTFS fields where available
8. Existing Relay Rider administrative rules

### Product output

Each candidate should include:

- Access Point name
- GTFS stop or station identifier
- Transit agency
- Served routes
- Approximate walking distance from the relevant zone or destination
- Scheduled service availability during the participant's time window
- Accessibility data availability
- Candidate-review status
- Reason the candidate appeared

---

## 2. Commuter-Option Previews

GTFS may support commuter-option previews by determining:

- Distance from an approximate origin zone to transit
- Transit departure availability within the commuter's time window
- Number of transfers
- Scheduled travel time
- First-mile and last-mile gaps
- Whether a planned shared route complements transit
- Whether an Access Point is served during a participant's work, class, or shift schedule

GTFS-derived information should be combined with Relay Rider's planned-route and institutional-program inputs, including:

- Approximate origin and destination zones
- Days and time windows
- Schedule flexibility
- Planned-route overlap
- Estimated detour impact
- Access Point willingness
- EV/hybrid preference
- Accessibility preference
- Privacy setting
- Institution or cohort membership
- Proposed contribution compatibility
- Program rules and administrative-review status

### Example match explanation

> This commuter option appeared because the planned route overlaps your corridor, reaches a Metro A Line Access Point, and fits within your stated arrival window with an estimated six-minute detour.

### Explanation requirements

Every transit-informed commuter option should identify:

- Why the option was generated
- Which GTFS stop, station, route, or service window informed it
- The estimated first-mile or last-mile gap
- The scheduled, not guaranteed, transit timing used
- The estimated planned-route detour
- Any administrative review still required
- Any known feed limitations or stale-data warning

### Required disclaimer

> This is a commuter-option preview based on planned-route, program, and published transit-schedule information. It is not a guaranteed ride, guaranteed transit connection, confirmed transportation purchase, or promise that a route will operate. Administrative review may be required.

---

## 3. Corridor Analytics

Relay Rider may use GTFS Schedule data to calculate or model:

- Transit stops and stations per corridor
- Service frequency by time window
- Early-morning service gaps
- Late-shift service gaps
- Weekend service gaps
- Destinations beyond practical walking distance from transit
- Campuses or employment sites with weak transit connectivity
- Potential multimodal Access Points
- Transfer complexity by corridor
- Transit travel-time ranges by schedule window
- Corridors where planned-route coordination may complement, rather than replace, transit

### Institutional dashboard outputs

Program administrators may see:

- Transit coverage by participant origin zone
- Transit availability by work, class, or shift window
- Percentage of commute demand within a configurable distance of transit
- High-demand zones with low scheduled service
- Access Point candidate density
- Multimodal commuter-option counts
- Unmatched demand attributed to transit-service gaps
- Early/late-shift coverage gaps
- Corridor comparison by transit availability
- Feed freshness and validation status

### Reporting guardrails

All dashboard results should use appropriate language such as:

- Scheduled service
- Published feed
- Estimated walking distance
- Modeled access gap
- Potential multimodal Access Point
- Scenario-based commuter option

Relay Rider should not claim that GTFS proves:

- Actual transit ridership
- Actual commuter behavior
- Guaranteed transit arrival
- Guaranteed parking reduction
- Guaranteed vehicle-trip reduction
- Guaranteed emissions reduction

Those outcomes require additional operational, survey, administrative, and outcome data.

---

## 4. GTFS-Realtime Overlays

GTFS-Realtime should be an optional operational-information layer for:

- Delays
- Cancellations
- Service alerts
- Vehicle positions
- Predicted arrival changes

Realtime data should provide context to a preview or dashboard without controlling Relay Rider's core planned-route compatibility score.

### Appropriate uses

- Mark a transit connection as delayed or disrupted
- Show a service alert associated with an Access Point
- Display the freshness of the latest realtime update
- Warn an administrator that a corridor is currently disrupted
- Compare scheduled and predicted arrival information

### Inappropriate uses

GTFS-Realtime should not be used to:

- Dispatch planned-route participants
- Assign the nearest participant
- Promise an exact pickup time
- Guarantee a transit connection
- Automatically activate a route
- Replace administrative review
- Transform Relay Rider into an instant-pickup or live ride-hailing service

---

## 5. Data Flow

### GTFS Schedule pipeline

```text
Agency GTFS ZIP files
        ↓
GTFS ingestion and validation
        ↓
Feed versioning and provenance records
        ↓
Normalized transit database
        ↓
Stops + routes + trips + service calendars + shapes
        ↓
Access Point candidate layer
        ↓
Corridor and schedule compatibility calculations
        ↓
Relay Rider match previews and program dashboards
```

### GTFS-Realtime pipeline

```text
GTFS-Realtime feeds
        ↓
Fetch, decode, and validate
        ↓
Temporary realtime cache
        ↓
Entity-to-static-feed reconciliation
        ↓
Delay, alert, and service-status overlays
```

### Design principle

Static GTFS should be treated as versioned analytical source data. GTFS-Realtime should be treated as ephemeral operational context with explicit timestamps, freshness controls, and automatic expiration.

---

## 6. Core Database Tables

### `transit_agencies`

Stores normalized agency identity and attribution information.

Suggested fields:

- `id`
- `agency_key`
- `agency_name`
- `agency_url`
- `agency_timezone`
- `agency_lang`
- `agency_phone`
- `agency_fare_url`
- `source_feed_id`
- `created_at`
- `updated_at`

### `transit_feeds`

Registry of agency static and realtime sources.

Suggested fields:

- `id`
- `agency_id`
- `feed_name`
- `feed_type` (`schedule`, `trip_updates`, `vehicle_positions`, `alerts`)
- `source_url`
- `access_method`
- `requires_key`
- `license_name`
- `attribution_text`
- `public_display_allowed`
- `active`
- `last_checked_at`
- `last_success_at`
- `last_failure_at`
- `created_at`
- `updated_at`

### `transit_feed_versions`

Tracks immutable static feed imports and validation results.

Suggested fields:

- `id`
- `transit_feed_id`
- `content_hash`
- `downloaded_at`
- `feed_start_date`
- `feed_end_date`
- `validation_status`
- `validation_report`
- `record_counts`
- `source_etag`
- `source_last_modified`
- `is_current`
- `created_at`

### `transit_stops`

Stores normalized GTFS stops, stations, entrances, nodes, and boarding areas.

Suggested fields:

- `id`
- `feed_version_id`
- `agency_id`
- `gtfs_stop_id`
- `stop_code`
- `stop_name`
- `stop_description`
- `latitude`
- `longitude`
- `location_type`
- `parent_station_gtfs_id`
- `wheelchair_boarding`
- `platform_code`
- `zone_id`
- `geometry`
- `created_at`

### `transit_routes`

Suggested fields:

- `id`
- `feed_version_id`
- `agency_id`
- `gtfs_route_id`
- `route_short_name`
- `route_long_name`
- `route_description`
- `route_type`
- `route_url`
- `route_color`
- `route_text_color`
- `created_at`

### `transit_trips`

Suggested fields:

- `id`
- `feed_version_id`
- `gtfs_trip_id`
- `route_id`
- `service_id`
- `shape_id`
- `trip_headsign`
- `trip_short_name`
- `direction_id`
- `block_id`
- `wheelchair_accessible`
- `bikes_allowed`
- `created_at`

### `transit_stop_times`

Suggested fields:

- `id`
- `trip_id`
- `stop_id`
- `stop_sequence`
- `arrival_time_seconds`
- `departure_time_seconds`
- `pickup_type`
- `drop_off_type`
- `timepoint`
- `shape_dist_traveled`
- `created_at`

Store GTFS times as service-day offsets capable of representing values greater than `24:00:00`.

### `transit_calendars`

Suggested fields:

- `id`
- `feed_version_id`
- `service_id`
- `monday`
- `tuesday`
- `wednesday`
- `thursday`
- `friday`
- `saturday`
- `sunday`
- `start_date`
- `end_date`

### `transit_calendar_dates`

Suggested fields:

- `id`
- `feed_version_id`
- `service_id`
- `service_date`
- `exception_type`

### `transit_shapes`

Suggested fields:

- `id`
- `feed_version_id`
- `gtfs_shape_id`
- `shape_sequence`
- `latitude`
- `longitude`
- `shape_dist_traveled`
- `geometry_point`

A derived route geometry table or materialized view may be used for spatial corridor analysis.

### `transit_transfers`

Suggested fields:

- `id`
- `feed_version_id`
- `from_stop_id`
- `to_stop_id`
- `from_route_id`
- `to_route_id`
- `from_trip_id`
- `to_trip_id`
- `transfer_type`
- `minimum_transfer_time_seconds`

### `transit_pathways`

Suggested fields:

- `id`
- `feed_version_id`
- `gtfs_pathway_id`
- `from_stop_id`
- `to_stop_id`
- `pathway_mode`
- `is_bidirectional`
- `length_meters`
- `traversal_time_seconds`
- `stair_count`
- `maximum_slope`
- `minimum_width_meters`
- `signposted_as`
- `reversed_signposted_as`

### `transit_realtime_trip_updates`

Suggested fields:

- `id`
- `transit_feed_id`
- `feed_timestamp`
- `entity_id`
- `gtfs_trip_id`
- `gtfs_route_id`
- `start_date`
- `start_time`
- `schedule_relationship`
- `delay_seconds`
- `payload`
- `expires_at`
- `created_at`

### `transit_realtime_vehicle_positions`

Suggested fields:

- `id`
- `transit_feed_id`
- `feed_timestamp`
- `entity_id`
- `vehicle_id`
- `vehicle_label`
- `gtfs_trip_id`
- `gtfs_route_id`
- `latitude`
- `longitude`
- `bearing`
- `speed_meters_per_second`
- `current_stop_sequence`
- `current_status`
- `occupancy_status`
- `payload`
- `expires_at`
- `created_at`

### `transit_realtime_alerts`

Suggested fields:

- `id`
- `transit_feed_id`
- `feed_timestamp`
- `entity_id`
- `active_periods`
- `informed_entities`
- `cause`
- `effect`
- `header_text`
- `description_text`
- `url`
- `severity_level`
- `payload`
- `expires_at`
- `created_at`

### `access_point_candidates`

Stores candidate locations generated from transit, institutional, civic, parking, charging, or manually reviewed sources.

Suggested fields:

- `id`
- `name`
- `candidate_type`
- `source_type`
- `source_reference`
- `latitude`
- `longitude`
- `geometry`
- `institution_id`
- `visibility_review_status`
- `lighting_review_status`
- `accessibility_review_status`
- `property_review_status`
- `administrative_review_status`
- `privacy_classification`
- `notes`
- `created_at`
- `updated_at`

### `access_point_transit_links`

Links candidate Access Points to GTFS stops or stations.

Suggested fields:

- `id`
- `access_point_candidate_id`
- `transit_stop_id`
- `distance_meters`
- `estimated_walk_seconds`
- `link_method`
- `served_route_count`
- `service_window_summary`
- `accessibility_data_available`
- `created_at`
- `updated_at`

---

## 7. Ingestion and Validation Requirements

Each static feed import should:

1. Download the agency GTFS ZIP from the registered source.
2. Record source URL, retrieval timestamp, HTTP metadata, and content hash.
3. Run structural and semantic validation.
4. Reject or quarantine imports with blocking errors.
5. Preserve warning-level validation results.
6. Normalize agency identifiers without discarding original GTFS identifiers.
7. Load the feed into an immutable version namespace.
8. Build spatial indexes and derived route geometries.
9. Recalculate Access Point transit links.
10. Mark the new version current only after successful processing.

### Minimum validation checks

- Required files and required fields
- Referential integrity between routes, trips, stop times, stops, calendars, and shapes
- Valid latitude and longitude values
- Unique identifiers within the feed
- Stop-time sequence ordering
- Service calendar coverage
- Valid route types
- Parent-station relationships
- Duplicate records
- Feed expiration or stale coverage
- Realtime entity reconciliation with the current static feed

---

## 8. Feed Freshness and Provenance

Every user-visible transit-derived output should retain provenance sufficient to identify:

- Agency
- Feed URL
- Static feed version
- Retrieval time
- Service date
- Realtime feed timestamp where applicable
- Validation status
- Known warnings

### Freshness states

Recommended states:

- `current`
- `aging`
- `stale`
- `expired`
- `unavailable`
- `validation_failed`

Realtime records should expire automatically and must not be displayed without a source timestamp.

---

## 9. Privacy and Role Separation

GTFS is generally public agency data, but Relay Rider must not combine it with participant information in ways that reveal precise home locations or sensitive commute patterns.

Requirements:

- Use approximate participant zones before precise locations.
- Keep participant coordinates separate from public transit reference data.
- Apply role-based permissions to participant-level commute analysis.
- Display aggregate corridor analytics to administrators where practical.
- Do not expose another participant's exact origin, destination, or schedule through an Access Point recommendation.
- Log administrative access to sensitive match-preview information.

---

## 10. Non-Goals

This integration does not establish:

- A public transit booking function
- Fare payment or ticketing
- Guaranteed transit arrival information
- Live commuter dispatch
- Nearest-driver assignment
- Instant pickup
- Guaranteed route operation
- A public unrestricted transportation marketplace
- Certified emissions reductions
- Automatic Rule 2202 compliance

GTFS may contribute to transportation analysis, but Rule 2202 or Average Vehicle Ridership reporting requires employer, survey, program, and regulatory data beyond GTFS.

---

## 11. Implementation Phases

### Phase 1 — Static GTFS foundation

Build:

- Agency feed registry
- Static ZIP ingestion
- Validation report storage
- Versioned normalized tables
- Stops, routes, trips, stop times, calendars, and shapes
- Map rendering for stops and routes
- Feed freshness dashboard

### Phase 2 — Access Point intelligence

Build:

- Spatial links between destinations and GTFS stops
- Candidate Access Point generation
- Administrative review statuses
- Walking-distance estimates
- Served-route and service-window summaries
- Explainable candidate cards

### Phase 3 — Commuter-option previews

Build:

- Transit availability by commute window
- First-mile and last-mile gap calculations
- Transfer and travel-time summaries
- Multimodal match explanations
- Program-rule integration
- Feed-provenance display

### Phase 4 — Corridor analytics

Build:

- Service-frequency calculations
- Early-, late-, and weekend-service gap analysis
- Weak-connectivity destination analysis
- Corridor comparison views
- Exportable institutional reports

### Phase 5 — GTFS-Realtime overlays

Build:

- Protobuf decoding
- Trip-update cache
- Vehicle-position cache
- Alert cache
- Static-to-realtime reconciliation
- Freshness and expiration controls
- Optional delay and disruption overlays

---

## 12. Acceptance Criteria

The GTFS integration is ready for demonstration when:

- An administrator can register and validate an agency static feed.
- Feed versions and validation results are auditable.
- Stops, routes, trips, calendars, and shapes can be queried by corridor and service date.
- The map clearly distinguishes transit stops from reviewed Access Points.
- A transit stop is never presented as institutionally approved without review status.
- A commuter-option preview explains the transit and planned-route factors that generated it.
- Approximate zones are used before precise participant locations.
- Feed timestamps and freshness states are visible.
- Realtime overlays expire and do not alter the core planned-route score.
- No screen implies guaranteed transportation, guaranteed transit arrival, automatic route activation, or live dispatch.

---

## 13. Source References

- General Transit Feed Specification repository: `https://github.com/google/transit`
- GTFS documentation: `https://gtfs.org/`

Agency feed endpoints, access requirements, licenses, attribution terms, and redistribution restrictions must be recorded separately in the Relay Rider agency-feed registry.