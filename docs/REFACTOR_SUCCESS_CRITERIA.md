# Refactor Acceptance Checklist

- [x] Institutional problem is visible within the default Program Console experience.
- [x] Participant view still describes planned-route coordination rather than instant rides.
- [x] Real participant commute-need / planned-route research intake remains preserved.
- [x] Explainable simulated commuter-option previews expose route-fit, schedule, detour, overlap, Access Point, contribution, EV/hybrid, eligibility, accessibility, and review state.
- [x] Proposed contributions are explicitly participation signals, not fares or purchases.
- [x] Program reviewer can change demonstration review status.
- [x] Parking Intelligence exposes pressure and a scenario builder.
- [x] Green Route Credits are configurable as a capped employer-sponsored demonstration program.
- [x] EV / hybrid corridor participation has a dedicated workspace.
- [x] Commute Activity Ledger supports filtering and real CSV export of demo records.
- [x] Reporting center includes TDM, parking, sustainability, and Rule 2202 Reporting Readiness.
- [x] Interactive map preserves Leaflet and adds the requested mobility layers.
- [x] Demo records are labeled DEMO DATA / MODELED / ESTIMATED / SIMULATED.
- [x] No screen implies live dispatch, instant pickup, guaranteed transportation, automatic payment, guaranteed earnings, or unrestricted ride-hailing.
- [x] Production build/runtime checks pass.
- [x] CodeQL and dependency review pass.
- [x] Netlify deploy preview is built from the final validated branch head.
- [x] New research-beta governance fields round-trip through the Supabase staging RPC; validation data was removed after testing.

## Remaining acceptance work

- [ ] Conduct hands-on visual and interaction QA on both iPhone and Pixel 10 presets.
- [ ] Surface the newly supported institution/cohort/privacy context and planned-route governance fields in the participant intake UI.
- [ ] Replace demonstration role switching with authenticated production RBAC before governed program use.
- [ ] Replace simulated match-preview scoring with source-backed computation from eligible participant records.
