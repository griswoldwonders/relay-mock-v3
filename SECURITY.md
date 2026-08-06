# Security Policy

## Supported scope

This repository is a public, synthetic-data product prototype for Common Pathways Technologies and Relay Rider. It demonstrates an institution-sponsored commuter coordination workflow; it is not an operational transportation service. Only the default branch and current demonstration deployment are supported.

## Reporting a vulnerability

Do not disclose a suspected vulnerability in a public issue, pull request, discussion, screenshot, or social-media post.

Email **relayridersupport@gmail.com** with the affected file, route, workflow, or deployment; a concise impact statement; non-destructive reproduction steps; and any relevant timestamps or request IDs. Remove secrets and personal information from supporting material.

Do not access, change, download, retain, or disclose data that does not belong to you. Do not perform denial-of-service testing, credential attacks, social engineering, persistence, or testing against third-party services.

## Public-repository boundary

Only synthetic demonstration content belongs in this repository. Do not commit:

- participant, employee, student, driver, or partner records;
- precise home locations, private schedules, accessibility requests, or identity documents;
- API keys, database credentials, private keys, environment files, session values, or deployment tokens;
- confidential match weights, scoring formulas, commercial assumptions, or internal operating documents; or
- unapproved claims that transportation, incentives, emissions outcomes, or route acceptance are guaranteed.

Any exposed credential must be treated as compromised and rotated outside GitHub; deleting it from the latest commit is not sufficient.

## Security expectations

- Protected review before changes reach `main`.
- Pinned GitHub Actions and least-privilege workflow permissions.
- Automated dependency review and static analysis.
- No production secrets or administrative APIs in browser code.
- Approximate zones before precise locations.
- Explainable simulated match previews, with administrative review required.
- Privacy, accessibility, data-retention, and incident controls must be reviewed before any controlled operational beta.
