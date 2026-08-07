# Institutional Demo Acceptance Checklist

Corridor: Pasadena ↔ Eagle Rock ↔ Glendale

Operating spine: **Signal → Record → Score → Preview → Task → Review → Dashboard → Report → Partner Action**

A partner-facing demo should be called **tested** only after each required step below is verified. A visual prototype that has not been verified should remain labeled **simulated** or **draft**.

## Scenario

Use one clearly labeled synthetic commuter case:

- Approximate origin zone: Eagle Rock
- Destination zone: Pasadena institutional destination
- Commute window: weekday morning
- Parking difficulty: elevated
- Schedule flexibility: limited-to-moderate
- Access Point willingness: yes
- EV/hybrid preference: optional/positive
- Charging interest: demo signal only if captured
- Proposed contribution: participation signal only
- Institution/cohort: synthetic demo cohort

Use at least one synthetic planned route already intended to travel through the corridor.

## Acceptance sequence

| Step | Test | Pass condition | Status |
|---|---|---|---|
| Signal | Commuter Need Intake opens and validates fields | Required fields are clear; no ride-hailing language | [ ] PASS [ ] FAIL [ ] BLOCKED |
| Signal | Planned Route Registration opens and validates fields | Existing planned route, capacity, detour and Access Point fields are present | [ ] PASS [ ] FAIL [ ] BLOCKED |
| Record | Submit commuter need | Record persists with timestamp, source and synthetic/observed classification | [ ] PASS [ ] FAIL [ ] BLOCKED |
| Record | Submit planned route | Route persists and is visible to appropriate admin workflow | [ ] PASS [ ] FAIL [ ] BLOCKED |
| Record | Map renders | Base map, corridor, research anchors and Access Point candidates render with attribution | [ ] PASS [ ] FAIL [ ] BLOCKED |
| Score | Compatibility score runs | Output is traceable to documented factors without exposing confidential formula weights | [ ] PASS [ ] FAIL [ ] BLOCKED |
| Score | Limiting factor appears | Weakness such as time, detour, Access Point, eligibility or contribution gap is explained | [ ] PASS [ ] FAIL [ ] BLOCKED |
| Preview | Commuter option renders | Shows route fit, detour, schedule fit, Access Point, EV/hybrid indicator and review status | [ ] PASS [ ] FAIL [ ] BLOCKED |
| Preview | Prototype disclaimer appears | States option is simulated/not guaranteed and proposed contribution is not a transportation purchase | [ ] PASS [ ] FAIL [ ] BLOCKED |
| Task | Admin task generated | Task has owner, category, priority, due date and evidence link | [ ] PASS [ ] FAIL [ ] BLOCKED |
| Review | Admin review can be completed | Approve for preview / request information / suppress / archive actions work | [ ] PASS [ ] FAIL [ ] BLOCKED |
| Dashboard | Decision Card appears | Finding, why it matters, evidence, confidence, owner and recommended action are visible | [ ] PASS [ ] FAIL [ ] BLOCKED |
| Dashboard | Metric provenance visible | Each relevant metric says Observed / Synthetic / Calculated / Modeled | [ ] PASS [ ] FAIL [ ] BLOCKED |
| Report | Decision brief exports or renders | One partner-facing report can be generated from the case | [ ] PASS [ ] FAIL [ ] BLOCKED |
| Partner Action | Report ends with one next action | Recommendation is specific, governed and non-operational | [ ] PASS [ ] FAIL [ ] BLOCKED |

## Required Decision Card

**Finding:** Strong corridor overlap and morning schedule fit are present, but the scenario has an unresolved Access Point or planned-route capacity constraint.

**Why it matters:** The institution should not treat demand alone as evidence that a commuter option is ready to operate.

**Evidence:** Synthetic commuter record, synthetic planned-route record, map context, compatibility preview, administrative review status.

**Recommended institutional action:** Continue data collection and review Access Point/planned-route capacity before considering a controlled commuter-program scenario.

**Confidence:** Synthetic demonstration.

**Owner:** Mobility / TDM program administrator.

**Success metric:** Constraint is resolved or additional evidence confirms that the corridor should remain in monitoring status.

## Mobile / desktop QA

- [ ] 360–390 px mobile width
- [ ] tablet width
- [ ] desktop width
- [ ] map pan/zoom works
- [ ] filter buttons are keyboard accessible
- [ ] modal has a clear close action
- [ ] no content is clipped behind mobile keyboard/runtime chrome
- [ ] text remains readable at 200% browser zoom where practicable
- [ ] focus indicators are visible

## Language QA

Reject the demo if any screen implies:

- live dispatch
- instant pickup
- public booking
- guaranteed transportation
- automatic payment
- fare purchase
- guaranteed earnings
- automatic route activation
- guaranteed Access Point safety
- verified emissions reductions without validated methodology

Preferred terms include **planned route**, **commuter option**, **compatibility preview**, **Access Point**, **proposed contribution**, **administrative review**, **modeled outcome**, and **institution-sponsored program**.

## Release evidence

Record for every partner demo:

- repository
- branch
- commit SHA
- deployment environment
- deployment timestamp
- acceptance-test date
- tester
- PASS / FAIL / BLOCKED summary
- known limitations
- rollback/reference commit
