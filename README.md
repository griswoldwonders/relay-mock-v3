# Relay Rider V2 — MIT Engineering App

An operational React prototype for Relay Rider's planned-route commuter coordination system.

## Included

- Driver route posting
- Rider bid posting
- Corridor and Safe Anchor Point selection
- EV driver profiles
- Mock matching and sonar logic
- Leaflet/OpenStreetMap operational map
- Administrative dashboard
- Responsive interface

> This repository is a prototype. It does not collect payments or activate live rides.

## Open in StackBlitz

[Launch Relay Rider V2 in StackBlitz](https://stackblitz.com/github/griswoldwonders/relay-rider-v2-mit-engineering-app)

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Technology

- React
- TypeScript
- Vite
- Leaflet and OpenStreetMap, loaded dynamically by the application

## V2.1 commuter-program update

The prototype now includes:

- verified institution-oriented onboarding and privacy controls
- a personalized EV commute plan
- proposed EV-credit, parking, and mode-shift programs
- trip logging with pending/verified evidence states
- administrator metrics for solo trips avoided, shared miles, estimated emissions, and provisional credit liability
- explicit partner approval and Rule 2202 reporting review gates

Product patterns were informed by public materials from [sRide](https://sride.co/enterprise/) and [RideAmigos](https://rideamigos.com/), then adapted to Relay Rider's institution-funded EV/TDM model. Names, wording, user interface, calculations, and workflows in this repository are original prototype implementations.
