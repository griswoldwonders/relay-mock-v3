# Relay Rider Institution-Sponsored Beta Prototype

A mobile-first Relay Rider prototype for institution-funded commuter coordination and Transportation Demand Management.

## Current product model

Relay Rider helps employers, campuses, hospitals, municipalities, and other institutions coordinate commuters around:

- Recurring commute needs
- Planned routes participants already intend to travel
- Approximate origin and destination zones
- Compatible schedules
- Designated Access Points
- Explainable commuter-option previews
- Administrative review
- EV/hybrid participation
- Capped institution-sponsored incentives
- Modeled TDM reporting

Relay Rider is not an on-demand ride-hailing, taxi, shuttle, live-dispatch, instant-pickup, or guaranteed transportation service.

## Controlled-beta rules

- Approved beta commuters are not charged to participate.
- A commuter option is a compatibility preview, not a reservation or transportation purchase.
- Participation depends on route compatibility, capacity, mutual consent, program rules, and administrative review.
- Transportation, route acceptance, incentives, savings, safety, and modeled outcomes are not guaranteed.
- Institution-sponsored benefits are promotional, capped, and subject to verification, funding, and program approval.

## Product flows

- Join an institution-sponsored program
- Submit recurring commute needs
- Register an existing planned route
- Review explainable commuter-option previews
- Express route interest
- Review administrative status
- Review potential institution-sponsored benefits
- Manage consent and privacy controls
- Read the Privacy Policy and Terms of Service inside the prototype

## Legal and privacy drafts

- `docs/PRIVACY_POLICY.md`
- `docs/TERMS_OF_SERVICE.md`
- `docs/NOTICE_AT_COLLECTION.md`

These documents are planning drafts and require transportation, privacy, insurance, accessibility, and contract counsel review before operational activation.

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run check:runtime
npm run build
npm run test:sites
```

## StackBlitz

[Open the public repository in StackBlitz](https://stackblitz.com/github/griswoldwonders/relay-rider-v2-mit-engineering-app)
