# Relay Rider Mobile Prototype

A mobile-first Relay Rider prototype for institution-supported EV commuting and transportation demand management.

## Product flows

- Plan an EV-supported commute
- Review privacy-preserving route matches
- Inspect explainable match factors
- Log planned shared trips
- Track proposed EV credits and parking programs
- Review partner metrics and program gates
- Explore an interactive OpenStreetMap mobility map with proposed Relay Anchor Points, Pasadena public EV charging locations, and Metro A Line stations

The app remains a planning prototype. It does not process payments, redeem charging value, or activate live rides.

## Map data notes

- Base map: OpenStreetMap contributors
- Pasadena public charging locations: Pasadena Water & Power public station listings
- Pasadena rail stations: LA Metro A Line public materials
- Relay Anchor Points: proposed planning locations; each still requires site, safety, and partner approval

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
