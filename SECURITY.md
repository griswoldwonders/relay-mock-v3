# Security Policy

## Supported scope

This repository is a public product and engineering repository for Common Pathways Technologies and Relay Rider. It contains a demonstration institutional TDM workspace plus code that connects to the governed `Relay-Rider-RD` Supabase backend. It is not an operational transportation service. Only reviewed deployment states recorded in `DEPLOYMENT.json` and the current deployed-system source of truth may be represented as live.

## Reporting a vulnerability

Do not disclose a suspected vulnerability in a public issue, pull request, discussion, screenshot, or social-media post.

Email **relayridersupport@gmail.com** with the affected file, route, workflow, or deployment; a concise impact statement; non-destructive reproduction steps; and any relevant timestamps or request IDs. Remove secrets and personal information from supporting material.

Do not access, change, download, retain, or disclose data that does not belong to you. Do not perform denial-of-service testing, credential attacks, social engineering, persistence, or testing against third-party services.

## Public-repository boundary

Only synthetic demonstration content and code belong in this repository. Do not commit:

- participant, employee, student, planned-route participant, or partner records;
- precise home locations, private schedules, accessibility requests, or identity documents;
- service-role keys, database credentials, private keys, environment files, session values, or deployment tokens;
- confidential commercial assumptions or internal operating documents; or
- unapproved claims that transportation, incentives, emissions outcomes, safety, or route acceptance are guaranteed.

The Supabase browser publishable key is intentionally public and is not an administrative credential. Authorization must remain enforced by authenticated user tokens, tenant membership, row-level security, and reviewed RPC contracts. A service-role key must never be shipped to browser code.

Any exposed private credential must be treated as compromised and rotated outside GitHub; deleting it from the latest commit is not sufficient.

## Deployment and database controls

- `DEPLOYMENT.json` pins the reviewed live Supabase migration head and fingerprint.
- CI/builds fail closed when the repository migration head, deployment contract, live database fingerprint, or capability manifest drift.
- Database DDL changes must use reviewed migrations and update deployment evidence after live verification.
- Participant-facing writes use approximate origin/destination zones before any precise-location workflow.
- Match Preview generation and administrative review remain institutionally permissioned operations.

## Dependency audit policy

High-severity or greater vulnerabilities in production/runtime dependencies are release-blocking and are checked with:

`npm audit --omit=dev --audit-level=high`

Development/build dependencies remain subject to dependency review, CodeQL/static analysis, lockfile review, and periodic remediation. A currently known high-severity advisory in a nested development-only Nano ID dependency is not being represented as fixed; it should be removed when a compatible upstream dependency resolves it. Scoping the runtime release gate does not convert that dev-tool advisory into a production-runtime vulnerability or erase it from engineering debt.

## Security expectations

- Protected review before changes reach `main`.
- Pinned GitHub Actions and least-privilege workflow permissions.
- Automated dependency review and static analysis.
- No production secrets or administrative credentials in browser code.
- Approximate zones before precise locations.
- Explainable Match Previews, with administrative review required.
- Prototype-only Green Route Credits, trip simulations, and modeled detour displays must not be promoted into production records without separately verified systems.
- Privacy, accessibility, data-retention, and incident controls must be reviewed before any controlled operational beta.
