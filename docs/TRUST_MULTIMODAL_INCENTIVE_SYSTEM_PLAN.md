# Relay Rider — Trust, Multimodal, and Incentive System Plan

## Purpose

This document translates the latest product decisions into implementation requirements for the Relay Rider prototype and future controlled beta.

Relay Rider remains an institution-funded commuter coordination and TDM platform built around planned routes, compatible schedules, designated Access Points, proposed contributions, explainable commuter-option previews, and administrative review.

This plan does **not** authorize live dispatch, guaranteed transportation, automatic payments, unrestricted public matching, or guaranteed earnings.

---

## 1. Trust and Participation Layer

Trust infrastructure should be treated as a cross-cutting product layer rather than a standalone feature.

### Participant profile fields

```text
participant_id
institution_id
cohort_id
role
identity_verification_status
eligibility_status
email_verified
phone_verified
license_review_status
vehicle_review_status
insurance_document_status
background_review_status
accessibility_preferences
privacy_level
communication_preferences
reporting_status
suspension_status
average_reliability_rating
completed_program_interactions
no_show_count
incident_count
```

Prototype states should use explicit labels such as:

- Not submitted
- Submitted
- Under administrative review
- Verified for demonstration
- Additional review required

Do not imply that a verification check is complete unless the workflow is actually connected to a verification provider and operationally supported.

### Trust Center

Participant-facing Trust Center should include:

- Verification status
- Privacy settings
- Communication preferences
- Accessibility requests
- Blocked participants
- Report an issue
- Trusted-contact preferences
- Participation history
- Review history

### Trust language guardrail

Do not claim that these features guarantee safety. Use terms such as controlled participation, reviewed status, designated Access Point, privacy-aware communication, and administrative escalation.

---

## 2. In-App Messaging Architecture

Messaging should not operate as unrestricted public chat.

### Communication states

```text
MATCH_PREVIEW
INTEREST_EXPRESSED
ADMIN_REVIEW
ELIGIBLE_TO_CONNECT
CONNECTION_OPEN
ACCESS_POINT_CONFIRMED
PLANNED_ROUTE_COMPLETE
CLOSED
REPORTED
```

Before administrative eligibility:

- Do not expose phone numbers
- Do not expose personal email addresses
- Do not expose exact home addresses
- Do not allow unrestricted file sharing
- Do not allow off-platform payment coordination

After eligibility is confirmed, limited in-app coordination may be enabled subject to program rules.

### Message moderation and flagging

The system should support rule-based or assisted flagging for:

- Phone-number sharing
- External-payment requests
- Harassment or threats
- Attempts to move the interaction off-platform
- Requests for exact private addresses
- Discriminatory language
- Repeated unwanted contact

Reported interactions should be retained according to the program data-retention policy and routed to administrative review.

---

## 3. Structured Review and Reliability System

Relay Rider should prefer behavior-specific feedback over a generic public five-star marketplace score.

### Post-participation review fields

- Arrived within agreed time window
- Communicated clearly
- Followed selected Access Point plan
- Respected privacy preferences
- Followed agreed planned route
- Conduct was appropriate
- Would participate again

### Public-facing indicators

Examples:

- Verified participant
- Reliable communicator
- Access Point compliant
- Established participant
- New participant

Do not expose sensitive complaint details to other participants.

---

## 4. Multimodal Option Builder

The Match Preview Engine should support complete commute options that can combine planned routes with transit, walking, cycling, micromobility, parking, employer shuttles, and Access Point transfers.

### Supported segment types

```text
planned_route_segment
transit_segment
walking_segment
cycling_segment
micromobility_segment
parking_segment
employer_shuttle_segment
access_point_transfer
```

### New commuter-need fields

```text
maximum_total_travel_time
maximum_walk_minutes
maximum_transfers
transit_pass_available
bicycle_available
micromobility_willingness
park_and_ride_willingness
mobility_device_requirements
preferred_modes
excluded_modes
```

### Access Point fields

```text
nearby_transit_routes
walkability_score
bike_access
micromobility_access
parking_availability
charging_availability
accessibility_features
lighting_review_status
visibility_review_status
institutional_approval_status
hours_of_availability
```

### Match output

Each commuter option should explain the itinerary rather than simply returning a score.

Example:

```text
7:18 AM — Walk 5 minutes to Access Point
7:25 AM — Join compatible planned route
7:47 AM — Arrive at transit station
7:54 AM — Board transit
8:08 AM — Walk 4 minutes to destination
```

Each option should show:

- Total estimated travel time
- Planned-route portion
- Transit portion
- Walking portion
- Number of transfers
- Estimated detour
- Proposed-contribution compatibility
- Access Point
- Accessibility compatibility
- EV/hybrid indicator
- Program eligibility status
- Why the option appeared

Relay Rider is coordinating and explaining a commuter option; it is not operating the transit or micromobility segments.

---

## 5. Incentive Strategy Engine

Institutional incentives should be targeted to participation gaps and governed by explicit program rules.

### Incentive record

```text
incentive_program_id
institution_id
name
incentive_type
eligible_cohorts
eligible_corridors
eligible_modes
eligible_time_windows
maximum_per_participant
maximum_program_budget
approval_required
start_date
end_date
funding_source
status
```

### Supported incentive types

- Green Route Credit
- Transit subsidy
- Micromobility benefit
- Preferential parking eligibility
- Reduced parking fee
- Charging benefit
- Access Point participation benefit
- Corridor participation benefit
- Contribution-gap support
- Emergency commute-support benefit

### Incentive rule example

```text
IF corridor = Pasadena–Glendale
AND arrival_window = 7:00–9:00 AM
AND parking_pressure_score > 75
AND participant is eligible
AND match_preview_score >= 80
THEN show estimated $4 employer-sponsored Green Route Credit
SUBJECT TO administrative approval and available program budget
```

### User-facing disclosure

> This commuter option may qualify for an estimated employer-sponsored Green Route Credit. Eligibility, availability, and administrative approval are required.

Green Route Credits must not be described as fares, wages, cash, guaranteed earnings, certified offsets, LCFS credits, or guaranteed reimbursements unless formally established.

---

## 6. Explainable Compatibility Architecture

Do not collapse route fit, trust readiness, multimodal compatibility, and incentives into one opaque score.

Expose component scores or statuses such as:

```text
Route Fit Score
Schedule Fit Score
Access Point Fit Score
Multimodal Fit Score
Accessibility Fit
Program Eligibility Status
Trust Readiness Status
Contribution Compatibility
Estimated Incentive Eligibility
```

A composite compatibility score may still be displayed, but every match preview must explain why it was generated.

Example explanation:

> This option appeared because the planned route overlaps most of your requested corridor, fits within your stated time flexibility, uses a designated Access Point, and satisfies current program rules. Estimated detour and contribution compatibility are shown for review.

---

## 7. Administrative Review Queue Expansion

The existing review queue should become a unified operational console.

### Review categories

- Participant eligibility
- Verification documents
- Commuter-option approval
- Access Point suitability
- Accessibility request
- Incentive eligibility
- Proposed-contribution compatibility
- Reported conduct
- Communication flag
- Suspension or reinstatement
- Data correction or deletion request

### Review record

```text
review_id
review_type
participant_ids
match_preview_id
program_id
risk_level
reason
evidence
assigned_admin
status
decision
decision_notes
created_at
resolved_at
```

### Administrative actions

- Approve for continued review
- Request more information
- Deny commuter option
- Change Access Point
- Remove incentive eligibility
- Restrict communication
- Suspend participant
- Escalate incident
- Close with no action

Prototype controls must not appear operational unless their workflows are actually implemented.

---

## 8. Dashboard and Reporting Metrics

### Trust and participation

- Verification completion rate
- Eligible participant rate
- Reports per 100 interactions
- Block rate
- Administrative-review turnaround
- Access Point compliance rate
- Repeat participation rate
- Reliability-feedback distribution
- Voluntary comfort/confidence survey score

### Multimodal performance

- Options containing transit connections
- Average walking distance
- Average number of transfers
- Planned-route-to-transit connections
- First/last-mile gap
- Options rejected for excessive travel time
- Access Points with strongest transit connectivity
- Estimated parking demand displaced

### Incentive performance

- Credits offered
- Credits approved
- Credits used
- Budget committed
- Observed participation change
- Cost per incremental participant
- Match previews improved through incentive support
- Contribution gaps reduced
- Parking-pressure corridors supported

Use observed, estimated, modeled, or scenario-based language depending on the underlying data quality.

---

## 9. Revised End-to-End Product Flow

```text
1. Commuter Need Intake
2. Planned Route Registration
3. Identity and Eligibility Status
4. Multimodal Option Generation
5. Explainable Match Preview
6. Express Route Interest
7. Administrative Review
8. Incentive Eligibility Review
9. Limited In-App Coordination
10. Access Point Confirmation
11. Participation Feedback
12. Program Dashboard and Reporting
```

This extends the existing Corridor Exchange and Match Preview architecture. It does not replace the institution-funded TDM model.

---

## 10. Build Sequence

### Prototype now

1. Verification-status badges
2. Privacy and communication preferences
3. Trust Center mockup
4. Structured review categories
5. Multimodal itinerary card
6. Incentive eligibility label
7. Expanded administrative queue
8. Trust, multimodal, and incentive dashboard metrics

### Controlled-beta readiness

1. Real identity verification
2. Secure in-app messaging
3. Blocking and reporting
4. Incident case management
5. Review and reliability history
6. Real transit-feed integration
7. Program budget ledger
8. Incentive approval workflow
9. Data-retention and deletion controls

### Later operational capability

Only after legal, insurance, privacy, accessibility, and institutional review:

- Live participant communications
- Exact-location disclosure
- Operational route coordination
- Real incentive redemption
- Payment or contribution processing
- Automated enforcement actions

---

## Product Architecture Summary

Relay Rider should organize these capabilities into four connected systems:

1. **Corridor Intelligence** — demand, parking pressure, EV/hybrid participation, Access Point and multimodal context.
2. **Governed Commuter Options** — planned routes, proposed contributions, explainable match previews, Access Points, and program rules.
3. **Trust and Participation Operations** — verification states, privacy, messaging, reviews, blocking, reporting, incident and administrative workflows.
4. **Institutional Incentive Management** — Green Route Credits, parking and transit benefits, budget controls, eligibility rules, scenario modeling, and outcome reporting.

## Core Guardrail

Relay Rider must remain a planned-route commuter coordination and TDM platform. These additions should improve confidence, multimodal usefulness, and institutional program control without turning the product into live dispatch, guaranteed transportation, or an unrestricted public marketplace.
