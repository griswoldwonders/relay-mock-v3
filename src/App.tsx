import React, { useEffect, useMemo, useRef, useState } from "react";

/*
  Relay Rider V2 Operational Map + Sonar MVP
  Paste into CodeSandbox React template as src/App.jsx

  Built for:
  - Driver route posting
  - Rider bid posting
  - Route / corridor selection
  - Safe Anchor Point preference
  - EV driver profile
  - Match score
  - Working Leaflet/OpenStreetMap map
  - Sonar/radar scan
  - Admin dashboard
  - No payments
  - No live ride activation

  Notes:
  - The map is real Leaflet + OpenStreetMap loaded dynamically.
  - The matching and sonar are mock operational logic.
  - No payment collection and no live ride start exist in this build.
*/

const COLORS = {
  bg: "#070914",
  panel: "rgba(255,255,255,0.065)",
  panel2: "rgba(255,255,255,0.095)",
  border: "rgba(255,255,255,0.12)",
  white: "#ffffff",
  soft: "#c2c8dc",
  muted: "#9aa3bf",
  blue: "#007aff",
  yellow: "#ffc107",
  green: "#19c37d",
  red: "#ff3b30",
  purple: "#8b5cf6",
  orange: "#f97316",
  black: "#0d0d0d",
};

const CORRIDORS = [
  {
    id: "pasadena-glendale",
    name: "Pasadena ↔ Glendale ↔ Eagle Rock",
    phase: "Phase 1",
    type: "Campus EV Relay",
    demand: "High",
    color: "#19c37d",
    coords: [
      [34.1478, -118.1445],
      [34.1362, -118.2097],
      [34.1425, -118.2551],
    ],
    anchors: [
      "Pasadena City College",
      "Memorial Park / Del Mar A Line",
      "Glendale Transit Center",
      "Glendale Community College",
      "Eagle Rock Plaza",
    ],
  },
  {
    id: "burbank-pasadena",
    name: "Burbank Airport → Glendale → Pasadena",
    phase: "Phase 1",
    type: "Airport EV Relay",
    demand: "High",
    color: "#007aff",
    coords: [
      [34.2007, -118.3587],
      [34.1668, -118.228],
      [34.1236, -118.2585],
      [34.1478, -118.1445],
    ],
    anchors: [
      "Burbank Airport Transit Area",
      "Glendale Transit Center",
      "Pasadena EV Relay Hub",
      "Huntington Hospital Area",
    ],
  },
  {
    id: "hollywood-pasadena",
    name: "Hollywood / East Hollywood → Glendale / Pasadena",
    phase: "Phase 1",
    type: "Priority EV Relay",
    demand: "Medium",
    color: "#8b5cf6",
    coords: [
      [34.1016, -118.3387],
      [34.0874, -118.2912],
      [34.1236, -118.2585],
      [34.1478, -118.1445],
    ],
    anchors: [
      "Hollywood / Vine",
      "Los Angeles City College",
      "Children’s Hospital Area",
      "Glendale Transit Center",
    ],
  },
  {
    id: "union-sgv",
    name: "Union Station / Cal State LA → Pasadena / SGV",
    phase: "Phase 2",
    type: "Student + Transit EV Relay",
    demand: "Medium",
    color: "#ffc107",
    coords: [
      [34.0562, -118.2365],
      [34.066, -118.1687],
      [34.1478, -118.1445],
      [34.1321, -117.9709],
    ],
    anchors: [
      "Union Station",
      "Cal State LA Area",
      "Pasadena City College",
      "City of Hope / Duarte Area",
    ],
  },
];

const SAFE_POINTS = [
  {
    id: "pcc-edge",
    corridorId: "pasadena-glendale",
    name: "PCC Campus Edge",
    type: "Campus edge",
    lat: 34.1456,
    lng: -118.1182,
    score: 92,
    permission: "Needs review",
    details:
      "Public-facing campus edge. Good privacy-preserving pickup candidate.",
  },
  {
    id: "memorial-park",
    corridorId: "pasadena-glendale",
    name: "Memorial Park / Del Mar A Line",
    type: "Transit anchor",
    lat: 34.1478,
    lng: -118.1445,
    score: 94,
    permission: "Public review",
    details: "Strong transit-connected Safe Anchor Point candidate.",
  },
  {
    id: "glendale-transit",
    corridorId: "pasadena-glendale",
    name: "Glendale Transit Center",
    type: "Transit hub",
    lat: 34.1236,
    lng: -118.2585,
    score: 91,
    permission: "Public review",
    details: "Useful shared anchor for Glendale, Burbank, and Pasadena routes.",
  },
  {
    id: "eagle-rock-plaza",
    corridorId: "pasadena-glendale",
    name: "Eagle Rock Plaza Public Edge",
    type: "Retail/public lot",
    lat: 34.1362,
    lng: -118.2097,
    score: 84,
    permission: "Site review",
    details:
      "Possible public-facing midpoint, permission and traffic rules need review.",
  },
  {
    id: "burbank-airport-transit",
    corridorId: "burbank-pasadena",
    name: "Burbank Airport Transit Area",
    type: "Airport-adjacent",
    lat: 34.2007,
    lng: -118.3587,
    score: 83,
    permission: "Airport rules review",
    details: "Treat as corridor anchor first, not automatic pickup zone.",
  },
  {
    id: "pasadena-ev-hub",
    corridorId: "burbank-pasadena",
    name: "Pasadena EV Relay Hub",
    type: "EV hub",
    lat: 34.1459,
    lng: -118.1427,
    score: 90,
    permission: "Partner review",
    details: "Good destination hub with EV driver relevance.",
  },
  {
    id: "lacc-edge",
    corridorId: "hollywood-pasadena",
    name: "LACC Public Campus Edge",
    type: "Campus edge",
    lat: 34.0874,
    lng: -118.2912,
    score: 86,
    permission: "Needs review",
    details: "Useful for East Hollywood student and transit demand.",
  },
  {
    id: "hollywood-vine",
    corridorId: "hollywood-pasadena",
    name: "Hollywood / Vine Public Anchor",
    type: "Transit anchor",
    lat: 34.1017,
    lng: -118.3269,
    score: 84,
    permission: "Public review",
    details: "Good public point, but late-night safety review needed.",
  },
  {
    id: "union-station",
    corridorId: "union-sgv",
    name: "Union Station Transit Anchor",
    type: "Transit anchor",
    lat: 34.0562,
    lng: -118.2365,
    score: 88,
    permission: "Public review",
    details: "Strong regional transfer point, but traffic rules need review.",
  },
  {
    id: "calstate-la",
    corridorId: "union-sgv",
    name: "Cal State LA Public Edge",
    type: "Campus edge",
    lat: 34.066,
    lng: -118.1687,
    score: 82,
    permission: "Needs review",
    details: "Campus-adjacent point for student and transit corridor testing.",
  },
];

const EV_HUBS = [
  {
    id: "hub-pasadena",
    name: "Pasadena EV Relay Hub",
    lat: 34.1459,
    lng: -118.1427,
    type: "EV hub",
    plugs: 12,
    open: 6,
  },
  {
    id: "hub-glendale",
    name: "Glendale Transit EV Hub",
    lat: 34.1236,
    lng: -118.2585,
    type: "Transit + EV hub",
    plugs: 6,
    open: 3,
  },
  {
    id: "hub-burbank",
    name: "Burbank Airport EV Hub",
    lat: 34.2007,
    lng: -118.3587,
    type: "Airport EV hub",
    plugs: 4,
    open: 2,
  },
  {
    id: "hub-union",
    name: "Union Station EV Hub",
    lat: 34.0562,
    lng: -118.2365,
    type: "Transit EV hub",
    plugs: 6,
    open: 2,
  },
];

const TRAFFIC_PRESSURE = [
  {
    id: "traffic-hollywood-western",
    name: "US-101 / Hollywood-Western",
    corridorId: "hollywood-pasadena",
    lat: 34.1016,
    lng: -118.3087,
    score: 92,
    parking: 76,
    note: "Severe west-end traffic pressure near the Hollywood connector.",
  },
  {
    id: "traffic-vermont-sunset",
    name: "Vermont / Sunset Medical Cluster",
    corridorId: "hollywood-pasadena",
    lat: 34.0986,
    lng: -118.291,
    score: 88,
    parking: 82,
    note: "Hospital, campus, and transit activity create strong relay demand.",
  },
  {
    id: "traffic-ca2-glendale",
    name: "CA-2 / Glendale Freeway Connector",
    corridorId: "pasadena-glendale",
    lat: 34.1271,
    lng: -118.2447,
    score: 83,
    parking: 71,
    note: "Heavy connector pressure between Northeast LA and Glendale.",
  },
  {
    id: "traffic-brand-glendale",
    name: "Brand / Central Glendale",
    corridorId: "pasadena-glendale",
    lat: 34.1445,
    lng: -118.2551,
    score: 79,
    parking: 86,
    note: "Retail, employment, and transit traffic pressure signal.",
  },
  {
    id: "traffic-eagle-rock",
    name: "Eagle Rock / Colorado Boulevard",
    corridorId: "pasadena-glendale",
    lat: 34.1397,
    lng: -118.2142,
    score: 74,
    parking: 67,
    note: "Mid-corridor congestion and anchor opportunity.",
  },
  {
    id: "traffic-old-pasadena",
    name: "Old Pasadena / Memorial Park",
    corridorId: "pasadena-glendale",
    lat: 34.1478,
    lng: -118.1445,
    score: 71,
    parking: 79,
    note: "Civic, transit, and evening activity pressure near Pasadena core.",
  },
  {
    id: "traffic-pcc-caltech",
    name: "PCC / Caltech Corridor",
    corridorId: "pasadena-glendale",
    lat: 34.1412,
    lng: -118.1223,
    score: 66,
    parking: 73,
    note: "Campus and staff commute demand around Pasadena institutions.",
  },
];

const PARTNER_SIGNALS = [
  {
    id: "partner-school",
    type: "School / campus",
    demand: 84,
    parking: 79,
    evCoverage: 72,
    anchorReadiness: 76,
    nextStep: "Launch student and staff corridor survey",
  },
  {
    id: "partner-hospital",
    type: "Hospital / healthcare",
    demand: 88,
    parking: 86,
    evCoverage: 66,
    anchorReadiness: 71,
    nextStep: "Map shift windows and reviewed public anchors",
  },
  {
    id: "partner-employer",
    type: "Employer / office campus",
    demand: 73,
    parking: 81,
    evCoverage: 84,
    anchorReadiness: 69,
    nextStep: "Confirm worksite radius and commute clusters",
  },
];

const SCORE_WEIGHTS = {
  corridor: 0.16,
  safePoint: 0.22,
  bid: 0.12,
  ev: 0.13,
  detour: 0.12,
  privacy: 0.12,
  trafficOpportunity: 0.08,
  capacity: 0.05,
};

const initialProfile = {
  name: "Marcus J.",
  vehicle: "Tesla Model 3",
  connector: "NACS",
  rangeMiles: 212,
  verifiedEV: true,
  license: "Verified",
  insurance: "Uploaded",
  background: "Pending",
  maxDetour: 12,
};

const initialRoutes = [
  {
    id: "route_1001",
    driverName: "Marcus J.",
    corridorId: "pasadena-glendale",
    origin: "Glendale Transit Center",
    destination: "Pasadena EV Relay Hub",
    departure: "Today 5:30 PM",
    seats: 2,
    maxDetour: 10,
    safePointIds: ["glendale-transit", "memorial-park"],
    status: "Posted",
  },
];

const initialBids = [
  {
    id: "bid_2001",
    riderName: "Ava T.",
    corridorId: "pasadena-glendale",
    pickupPreference: "Safe Anchor Point",
    safePointId: "glendale-transit",
    dropoffPreference: "Near my destination",
    destinationArea: "Pasadena near Lake Ave",
    bidSignal: 24,
    timeWindow: "Today 5:15–6:00 PM",
    status: "Open",
  },
  {
    id: "bid_2002",
    riderName: "Jordan M.",
    corridorId: "burbank-pasadena",
    pickupPreference: "Safe Anchor Point",
    safePointId: "burbank-airport-transit",
    dropoffPreference: "Safe Anchor Point",
    destinationArea: "Pasadena EV Relay Hub",
    bidSignal: 28,
    timeWindow: "Today 6:00–7:00 PM",
    status: "Open",
  },
  {
    id: "bid_2003",
    riderName: "Maya S.",
    corridorId: "hollywood-pasadena",
    pickupPreference: "Safe Anchor Point",
    safePointId: "lacc-edge",
    dropoffPreference: "Near my destination",
    destinationArea: "Glendale near Brand Blvd",
    bidSignal: 22,
    timeWindow: "Today 7:00–8:00 PM",
    status: "Open",
  },
];

function createId(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 7);
}

function byId(list, id) {
  return list.find((item) => item.id === id);
}

function getCorridor(id) {
  return byId(CORRIDORS, id);
}

function getPoint(id) {
  return byId(SAFE_POINTS, id);
}

function pointName(id) {
  return getPoint(id)?.name || "No Safe Anchor selected";
}

function pointsFor(corridorId) {
  return SAFE_POINTS.filter((p) => p.corridorId === corridorId);
}

function money(value) {
  return "$" + Number(value || 0).toFixed(0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function haversineMiles(a, b) {
  const R = 3958.8;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function average(list, fallback = 0) {
  if (!list.length) return fallback;
  return list.reduce((sum, value) => sum + value, 0) / list.length;
}

function getTrafficSignals(corridorId) {
  return TRAFFIC_PRESSURE.filter((signal) => signal.corridorId === corridorId);
}

function getTrafficOpportunity(corridorId) {
  const signals = getTrafficSignals(corridorId);
  return Math.round(average(signals.map((signal) => signal.score), 64));
}

function getParkingPressure(corridorId) {
  const signals = getTrafficSignals(corridorId);
  return Math.round(average(signals.map((signal) => signal.parking), 60));
}

function getAnchorReadiness(corridorId) {
  const points = pointsFor(corridorId);
  return Math.round(average(points.map((point) => point.score), 55));
}

function weightedScore(parts) {
  return Math.round(
    parts.corridor * SCORE_WEIGHTS.corridor +
      parts.safePoint * SCORE_WEIGHTS.safePoint +
      parts.bid * SCORE_WEIGHTS.bid +
      parts.ev * SCORE_WEIGHTS.ev +
      parts.detour * SCORE_WEIGHTS.detour +
      parts.privacy * SCORE_WEIGHTS.privacy +
      parts.trafficOpportunity * SCORE_WEIGHTS.trafficOpportunity +
      parts.capacity * SCORE_WEIGHTS.capacity
  );
}

function getConfidence(parts, riskFlags) {
  const spread =
    Math.max(...Object.values(parts)) - Math.min(...Object.values(parts));
  const consistency = clamp(100 - spread * 0.45, 50, 100);
  const riskPenalty = riskFlags.length * 6;
  return Math.round(clamp(consistency - riskPenalty, 42, 96));
}

function getRouteCoordinate(route, mode) {
  const corridor = getCorridor(route.corridorId);
  if (!corridor) return { lat: 34.14, lng: -118.22 };
  const index = mode === "origin" ? 0 : corridor.coords.length - 1;
  const point = corridor.coords[index];
  return { lat: point[0], lng: point[1] };
}

function matchScore(route, bid, profile) {
  if (
    route.corridorId !== bid.corridorId ||
    route.status !== "Posted" ||
    bid.status !== "Open"
  )
    return null;

  const preferred = getPoint(bid.safePointId);
  const routeHasPoint = route.safePointIds.includes(bid.safePointId);
  const safePointScore = routeHasPoint
    ? 96
    : preferred
    ? Math.max(65, preferred.score - 14)
    : 55;
  const corridorScore =
    getCorridor(route.corridorId)?.demand === "High" ? 92 : 82;
  const bidScore = clamp(bid.bidSignal * 2.8, 40, 100);
  const evScore = profile.verifiedEV ? 96 : 55;
  const detourScore = clamp(100 - route.maxDetour * 1.8, 50, 100);
  const privacyScore =
    bid.dropoffPreference === "Private destination after review"
      ? 58
      : bid.dropoffPreference === "Near my destination"
      ? 88
      : 96;
  const trafficOpportunityScore = getTrafficOpportunity(route.corridorId);
  const capacityScore = route.seats > 0 ? 96 : 38;

  let distancePenalty = 0;
  if (preferred) {
    const origin = getRouteCoordinate(route, "origin");
    distancePenalty = Math.min(
      10,
      haversineMiles(origin, { lat: preferred.lat, lng: preferred.lng })
    );
  }

  const parts = {
    corridor: corridorScore,
    safePoint: safePointScore,
    bid: bidScore,
    ev: evScore,
    detour: detourScore,
    privacy: privacyScore,
    trafficOpportunity: trafficOpportunityScore,
    capacity: capacityScore,
  };

  const riskFlags = [
    !routeHasPoint ? "Anchor mismatch needs admin review" : null,
    profile.background !== "Approved" ? "Background check not approved" : null,
    preferred?.permission?.includes("Needs") ||
    preferred?.permission?.includes("Site") ||
    preferred?.permission?.includes("Airport")
      ? "Safe Anchor permission review needed"
      : null,
    bid.dropoffPreference === "Private destination after review"
      ? "Private destination needs admin review"
      : null,
    route.seats < 1 ? "No available seats" : null,
  ].filter(Boolean);

  const score = Math.round(weightedScore(parts) - distancePenalty * 0.7);
  const confidence = getConfidence(parts, riskFlags);
  const pilotGate =
    score >= 78 &&
    confidence >= 60 &&
    route.seats > 0 &&
    bid.dropoffPreference !== "Private destination after review"
      ? "Pilot review ready"
      : "Research review only";

  return {
    id: route.id + "_" + bid.id,
    route,
    bid,
    score,
    confidence,
    pilotGate,
    parts,
    riskFlags,
    label:
      score >= 90
        ? "Excellent"
        : score >= 82
        ? "Strong"
        : score >= 72
        ? "Possible"
        : "Weak",
    reasons: [
      routeHasPoint
        ? "Shared Safe Anchor Point"
        : "Alternate Safe Anchor needed",
      profile.verifiedEV ? "EV driver verified" : "EV verification needed",
      bid.dropoffPreference,
      "Traffic opportunity " + trafficOpportunityScore + "/100",
      "Confidence " + confidence + "/100",
      money(bid.bidSignal) + " bid signal",
      route.maxDetour + " min detour cap",
    ],
  };
}

function corridorReadiness(corridorId, routes, bids, matches) {
  const corridorRoutes = routes.filter((route) => route.corridorId === corridorId);
  const corridorBids = bids.filter((bid) => bid.corridorId === corridorId);
  const corridorMatches = matches.filter(
    (match) => match.route.corridorId === corridorId
  );
  const anchorReadiness = getAnchorReadiness(corridorId);
  const trafficOpportunity = getTrafficOpportunity(corridorId);
  const parkingPressure = getParkingPressure(corridorId);
  const supplyDemandBalance = clamp(
    corridorRoutes.length * 26 + corridorBids.length * 18,
    35,
    100
  );
  const avgMatch = corridorMatches.length
    ? Math.round(average(corridorMatches.map((match) => match.score)))
    : 48;
  const readiness = Math.round(
    anchorReadiness * 0.24 +
      trafficOpportunity * 0.18 +
      parkingPressure * 0.16 +
      supplyDemandBalance * 0.2 +
      avgMatch * 0.22
  );

  return {
    corridorId,
    readiness,
    anchorReadiness,
    trafficOpportunity,
    parkingPressure,
    supplyDemandBalance,
    avgMatch,
    routeCount: corridorRoutes.length,
    bidCount: corridorBids.length,
    matchCount: corridorMatches.length,
  };
}

function useLeafletMap({
  corridors,
  safePoints,
  evHubs,
  trafficPressure,
  routes,
  bids,
  selectedCorridorId,
  selectedRouteId,
  selectedMatch,
}) {
  const mapNode = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef([]);

  useEffect(() => {
    let cancelled = false;

    function loadCss() {
      if (document.getElementById("leaflet-css")) return;
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    function loadScript() {
      return new Promise((resolve, reject) => {
        if (window.L) return resolve(window.L);
        const existing = document.getElementById("leaflet-js");
        if (existing) {
          existing.addEventListener("load", () => resolve(window.L));
          existing.addEventListener("error", reject);
          return;
        }
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.onload = () => resolve(window.L);
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }

    loadCss();
    loadScript().then((L) => {
      if (cancelled || !mapNode.current || mapRef.current) return;
      const map = L.map(mapNode.current, {
        scrollWheelZoom: true,
        zoomControl: true,
      }).setView([34.13, -118.22], 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) return;

    layersRef.current.forEach((layer) => layer.remove());
    layersRef.current = [];
    const bounds = [];

    function add(layer) {
      layersRef.current.push(layer);
      layer.addTo(map);
      return layer;
    }

    function icon(html, size = 34) {
      return L.divIcon({
        html,
        className: "",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
      });
    }

    function markerHtml(label, color, shape = "circle") {
      const radius = shape === "pin" ? "50% 50% 50% 8px" : "50%";
      const rotate = shape === "pin" ? "rotate(-45deg)" : "none";
      const counter = shape === "pin" ? "rotate(45deg)" : "none";
      return `<div style="width:34px;height:34px;border-radius:${radius};background:${color};border:3px solid white;display:grid;place-items:center;box-shadow:0 8px 22px rgba(0,0,0,.35);transform:${rotate};"><span style="transform:${counter};font-weight:950;color:white;font-size:12px;">${label}</span></div>`;
    }

    const selectedOnly = selectedCorridorId
      ? corridors.filter((c) => c.id === selectedCorridorId)
      : corridors;
    selectedOnly.forEach((corridor) => {
      const poly = add(
        L.polyline(corridor.coords, {
          color: corridor.color,
          weight: 7,
          opacity: 0.86,
          lineCap: "round",
        })
      );
      poly.bindPopup(
        `<strong>${corridor.name}</strong><br/>${corridor.type}<br/>${corridor.phase}`
      );
      corridor.coords.forEach((p) => bounds.push(p));
    });

    safePoints
      .filter((p) => !selectedCorridorId || p.corridorId === selectedCorridorId)
      .forEach((p) => {
        const m = add(
          L.marker([p.lat, p.lng], {
            icon: icon(markerHtml("S", COLORS.green, "pin")),
          })
        );
        m.bindPopup(
          `<strong>${p.name}</strong><br/>Safe score: ${p.score}/100<br/>${p.type}<br/>${p.permission}`
        );
        bounds.push([p.lat, p.lng]);
      });

    evHubs.forEach((hub) => {
      const m = add(
        L.marker([hub.lat, hub.lng], {
          icon: icon(markerHtml("⚡", COLORS.yellow)),
        })
      );
      m.bindPopup(
        `<strong>${hub.name}</strong><br/>${hub.type}<br/>${hub.open}/${hub.plugs} plugs open`
      );
      bounds.push([hub.lat, hub.lng]);
    });

    trafficPressure
      .filter((signal) => !selectedCorridorId || signal.corridorId === selectedCorridorId)
      .forEach((signal) => {
        const color =
          signal.score >= 86
            ? COLORS.red
            : signal.score >= 75
            ? COLORS.orange
            : COLORS.yellow;
        const circle = add(
          L.circle([signal.lat, signal.lng], {
            radius: 1250,
            color,
            fillColor: color,
            fillOpacity: 0.18,
            opacity: 0.78,
            weight: 1,
          })
        );
        circle.bindPopup(
          `<strong>${signal.name}</strong><br/>Traffic opportunity: ${signal.score}/100<br/>Parking pressure: ${signal.parking}/100<br/>${signal.note}`
        );
        bounds.push([signal.lat, signal.lng]);
      });

    routes.forEach((route) => {
      if (selectedCorridorId && route.corridorId !== selectedCorridorId) return;
      const origin = getRouteCoordinate(route, "origin");
      const dest = getRouteCoordinate(route, "dest");
      const active = selectedRouteId === route.id;
      add(
        L.polyline(
          [
            [origin.lat, origin.lng],
            [dest.lat, dest.lng],
          ],
          {
            color: active ? COLORS.orange : COLORS.blue,
            weight: active ? 5 : 3,
            dashArray: "8 8",
            opacity: active ? 0.95 : 0.65,
          }
        )
      ).bindPopup(
        `<strong>Driver route</strong><br/>${route.driverName}<br/>${route.origin} → ${route.destination}`
      );
    });

    bids.forEach((bid) => {
      if (selectedCorridorId && bid.corridorId !== selectedCorridorId) return;
      const p = getPoint(bid.safePointId);
      if (!p) return;
      const isSelected = selectedMatch?.bid?.id === bid.id;
      const m = add(
        L.marker([p.lat + 0.004, p.lng + 0.004], {
          icon: icon(
            markerHtml(
              "$" + bid.bidSignal,
              isSelected ? COLORS.orange : COLORS.purple
            )
          ),
        })
      );
      m.bindPopup(
        `<strong>${bid.riderName}</strong><br/>Bid signal: ${money(
          bid.bidSignal
        )}<br/>${bid.dropoffPreference}`
      );
      bounds.push([p.lat, p.lng]);
    });

    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });
    setTimeout(() => map.invalidateSize(), 100);
  }, [
    corridors,
    safePoints,
    evHubs,
    trafficPressure,
    routes,
    bids,
    selectedCorridorId,
    selectedRouteId,
    selectedMatch,
  ]);

  return mapNode;
}

function OperationalMap(props) {
  const mapNode = useLeafletMap(props);

  return (
    <div className="mapShell">
      <div ref={mapNode} className="mapNode" />
      <div className="mapLegend">
        <span>
          <i style={{ background: COLORS.green }} /> Safe Anchor
        </span>
        <span>
          <i style={{ background: COLORS.yellow }} /> EV Hub
        </span>
        <span>
          <i style={{ background: COLORS.purple }} /> Rider Bid
        </span>
        <span>
          <i style={{ background: COLORS.blue }} /> Driver Route
        </span>
        <span>
          <i style={{ background: COLORS.orange }} /> Traffic Pressure
        </span>
      </div>
    </div>
  );
}

function SonarPanel({
  route,
  matches,
  scanResults,
  isScanning,
  onScan,
  onSelect,
  selectedMatch,
}) {
  const display = scanResults.length
    ? scanResults
    : matches.filter((m) => !route || m.route.id === route.id).slice(0, 5);
  const dots = display.slice(0, 6).map((match, index) => {
    const angle = -55 + index * 22;
    const distance = 28 + index * 6;
    const rad = (angle * Math.PI) / 180;
    return {
      match,
      x: 50 + Math.cos(rad) * distance,
      y: 50 + Math.sin(rad) * distance,
    };
  });

  return (
    <div className="sonarPanel">
      <div className="panelHead">
        <div>
          <span className="eyebrow small">Sonar Scan</span>
          <h2>Find riders in the driver’s direction.</h2>
          <p>
            {route
              ? `${route.origin} → ${route.destination}`
              : "Select a posted route to scan."}
          </p>
        </div>
        <button className="primary compact" onClick={onScan} disabled={!route}>
          {isScanning ? "Scanning..." : "Start Sonar"}
        </button>
      </div>

      <svg viewBox="0 0 100 100" className="sonarSvg">
        <defs>
          <radialGradient id="sonarGlowV2">
            <stop offset="0%" stopColor={COLORS.blue} stopOpacity="0.5" />
            <stop offset="76%" stopColor={COLORS.blue} stopOpacity="0.08" />
            <stop offset="100%" stopColor={COLORS.blue} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" rx="10" fill="rgba(0,0,0,.16)" />
        {[18, 34, 50, 66].map((r) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,.14)"
            strokeWidth=".5"
          />
        ))}
        <line
          x1="50"
          y1="6"
          x2="50"
          y2="94"
          stroke="rgba(255,255,255,.12)"
          strokeWidth=".4"
        />
        <line
          x1="6"
          y1="50"
          x2="94"
          y2="50"
          stroke="rgba(255,255,255,.12)"
          strokeWidth=".4"
        />
        <circle cx="50" cy="50" r="13" fill="url(#sonarGlowV2)" />
        <g className={isScanning ? "sweep scanning" : "sweep"}>
          <path
            d="M50 50 L86 18 A52 52 0 0 1 96 50 Z"
            fill="rgba(0,122,255,.2)"
          />
          <line
            x1="50"
            y1="50"
            x2="87"
            y2="18"
            stroke={COLORS.blue}
            strokeWidth="1.2"
          />
        </g>
        <circle
          cx="50"
          cy="50"
          r="3.2"
          fill={COLORS.blue}
          stroke="white"
          strokeWidth=".8"
        />
        {dots.map(({ match, x, y }) => (
          <g
            key={match.id}
            onClick={() => onSelect(match)}
            style={{ cursor: "pointer" }}
          >
            <circle
              cx={x}
              cy={y}
              r={selectedMatch?.id === match.id ? "4.8" : "3.6"}
              fill={match.score >= 88 ? COLORS.green : COLORS.yellow}
              stroke="white"
              strokeWidth=".7"
            />
            <text
              x={x + 5}
              y={y - 1}
              fill="white"
              fontSize="3.1"
              fontWeight="900"
            >
              {match.score}
            </text>
            <text x={x + 5} y={y + 3.5} fill={COLORS.soft} fontSize="2.5">
              {match.bid.riderName}
            </text>
          </g>
        ))}
      </svg>

      <div className="sonarResults">
        {display.length ? (
          display.map((m) => (
            <button
              key={m.id}
              className={
                selectedMatch?.id === m.id
                  ? "sonarMatch selected"
                  : "sonarMatch"
              }
              onClick={() => onSelect(m)}
            >
              <strong>{m.bid.riderName}</strong>
              <span>
                {m.score}% · {m.label}
              </span>
              <small>{pointName(m.bid.safePointId)}</small>
            </button>
          ))
        ) : (
          <p className="muted">
            No scan results yet. Select a posted route and start a scan.
          </p>
        )}
      </div>
    </div>
  );
}

function App() {
  const [tool, setTool] = useState("Operations Map");
  const [profile, setProfile] = useState(initialProfile);
  const [routes, setRoutes] = useState(initialRoutes);
  const [bids, setBids] = useState(initialBids);
  const [selectedCorridor, setSelectedCorridor] = useState("pasadena-glendale");
  const [selectedRouteId, setSelectedRouteId] = useState(initialRoutes[0].id);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scanResults, setScanResults] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [adminNote, setAdminNote] = useState(
    "V2 is operational planning only: no payments, no live ride activation."
  );

  const [routeDraft, setRouteDraft] = useState({
    corridorId: "pasadena-glendale",
    origin: "Glendale Transit Center",
    destination: "Pasadena EV Relay Hub",
    departure: "Today 5:30 PM",
    seats: 2,
    maxDetour: 10,
    safePointIds: ["glendale-transit", "memorial-park"],
  });

  const [bidDraft, setBidDraft] = useState({
    riderName: "New Rider",
    corridorId: "pasadena-glendale",
    pickupPreference: "Safe Anchor Point",
    safePointId: "glendale-transit",
    dropoffPreference: "Near my destination",
    destinationArea: "Pasadena near Lake Ave",
    bidSignal: 24,
    timeWindow: "Today 5:15–6:00 PM",
  });

  const matches = useMemo(() => {
    const out = [];
    routes.forEach((r) =>
      bids.forEach((b) => {
        const m = matchScore(r, b, profile);
        if (m) out.push(m);
      })
    );
    return out.sort((a, b) => b.score - a.score);
  }, [routes, bids, profile]);

  const readiness = useMemo(
    () =>
      CORRIDORS.map((corridor) =>
        corridorReadiness(corridor.id, routes, bids, matches)
      ).sort((a, b) => b.readiness - a.readiness),
    [routes, bids, matches]
  );

  const selectedRoute =
    routes.find((r) => r.id === selectedRouteId) || routes[0];

  function updateRoute(patch) {
    const next = { ...routeDraft, ...patch };
    if (patch.corridorId) {
      const first = pointsFor(patch.corridorId)[0];
      next.safePointIds = first ? [first.id] : [];
    }
    setRouteDraft(next);
  }

  function updateBid(patch) {
    const next = { ...bidDraft, ...patch };
    if (patch.corridorId) {
      const first = pointsFor(patch.corridorId)[0];
      next.safePointId = first ? first.id : "";
    }
    setBidDraft(next);
  }

  function postRoute() {
    const newRoute = {
      id: createId("route"),
      driverName: profile.name,
      status: "Posted",
      ...routeDraft,
    };
    setRoutes([newRoute, ...routes]);
    setSelectedRouteId(newRoute.id);
    setSelectedCorridor(routeDraft.corridorId);
    setAdminNote(
      "Driver route posted for " + getCorridor(routeDraft.corridorId).name + "."
    );
    setTool("Operations Map");
  }

  function postBid() {
    const newBid = { id: createId("bid"), status: "Open", ...bidDraft };
    setBids([newBid, ...bids]);
    setSelectedCorridor(bidDraft.corridorId);
    setAdminNote(
      "Rider bid posted for " + getCorridor(bidDraft.corridorId).name + "."
    );
    setTool("Sonar");
  }

  function startSonar() {
    if (!selectedRoute) return;
    setIsScanning(true);
    setScanResults([]);
    setSelectedMatch(null);

    setTimeout(() => {
      const result = matches
        .filter((m) => m.route.id === selectedRoute.id && m.score >= 70)
        .sort((a, b) => b.score - a.score);
      setScanResults(result);
      setSelectedMatch(result[0] || null);
      setIsScanning(false);
      setAdminNote(
        "Sonar scan completed for " +
          selectedRoute.origin +
          " → " +
          selectedRoute.destination +
          "."
      );
    }, 850);
  }

  const tools = [
    "Operations Map",
    "Sonar",
    "Driver Routes",
    "Rider Bids",
    "Corridors",
    "Safe Anchor Points",
    "EV Driver Profile",
    "Match Board",
    "Engineering Console",
    "Admin Dashboard",
  ];

  return (
    <div className="app">
      <style>{css}</style>

      <header>
        <div className="brand">
          <div className="mark">R</div>
          <div>
            <strong>Relay Rider V2</strong>
            <p>
              Operational planning map + sonar. No payments. No live ride
              activation.
            </p>
          </div>
        </div>

        <label className="toolMenu">
          Tool Menu
          <select value={tool} onChange={(e) => setTool(e.target.value)}>
            {tools.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </header>

      <main>
        <section className="hero">
          <div>
            <span className="eyebrow">Version 2 operational prototype</span>
            <h1>Map routes, scan riders, review matches.</h1>
            <p className="subtitle">
              Driver routes and rider bids now appear on a working OpenStreetMap
              map. Sonar scans a selected driver route and surfaces riders
              moving in that driver’s direction.
            </p>
          </div>
          <div className="stats">
            <Stat label="Routes" value={routes.length} />
            <Stat
              label="Open Bids"
              value={bids.filter((b) => b.status === "Open").length}
            />
            <Stat label="Matches" value={matches.length} />
            <Stat label="Sonar Results" value={scanResults.length} />
          </div>
        </section>

        <section className="layout">
          <aside>
            {tools.map((t) => (
              <button
                key={t}
                className={tool === t ? "nav active" : "nav"}
                onClick={() => setTool(t)}
              >
                {t}
              </button>
            ))}
          </aside>

          <section className="workspace">
            {tool === "Operations Map" && (
              <Panel eyebrow="Working map" title="Operational corridor map">
                <div className="mapControls">
                  <Select
                    label="Corridor layer"
                    value={selectedCorridor}
                    onChange={setSelectedCorridor}
                    options={CORRIDORS.map((c) => [c.id, c.name])}
                  />
                  <Select
                    label="Driver route focus"
                    value={selectedRoute?.id || ""}
                    onChange={setSelectedRouteId}
                    options={routes.map((r) => [
                      r.id,
                      `${r.origin} → ${r.destination}`,
                    ])}
                  />
                  <button
                    className="primary compact"
                    onClick={() => setTool("Sonar")}
                  >
                    Open Sonar
                  </button>
                </div>
                <OperationalMap
                  corridors={CORRIDORS}
                  safePoints={SAFE_POINTS}
                  evHubs={EV_HUBS}
                  trafficPressure={TRAFFIC_PRESSURE}
                  routes={routes}
                  bids={bids}
                  selectedCorridorId={selectedCorridor}
                  selectedRouteId={selectedRoute?.id}
                  selectedMatch={selectedMatch}
                />
                {selectedMatch && <MatchSummary match={selectedMatch} />}
              </Panel>
            )}

            {tool === "Sonar" && (
              <Panel eyebrow="Directional scan" title="Sonar match engine">
                <div className="mapControls">
                  <Select
                    label="Route to scan"
                    value={selectedRoute?.id || ""}
                    onChange={setSelectedRouteId}
                    options={routes.map((r) => [
                      r.id,
                      `${r.origin} → ${r.destination}`,
                    ])}
                  />
                  <button className="primary compact" onClick={startSonar}>
                    Start Sonar Scan
                  </button>
                </div>

                <div className="twoCol">
                  <SonarPanel
                    route={selectedRoute}
                    matches={matches}
                    scanResults={scanResults}
                    isScanning={isScanning}
                    onScan={startSonar}
                    onSelect={setSelectedMatch}
                    selectedMatch={selectedMatch}
                  />
                  <div>
                    <OperationalMap
                      corridors={CORRIDORS}
                      safePoints={SAFE_POINTS}
                      evHubs={EV_HUBS}
                      trafficPressure={TRAFFIC_PRESSURE}
                      routes={routes}
                      bids={bids}
                      selectedCorridorId={selectedRoute?.corridorId}
                      selectedRouteId={selectedRoute?.id}
                      selectedMatch={selectedMatch}
                    />
                    {selectedMatch && <MatchSummary match={selectedMatch} />}
                  </div>
                </div>
              </Panel>
            )}

            {tool === "Driver Routes" && (
              <Panel eyebrow="Driver supply" title="Post a driver route">
                <div className="formGrid">
                  <Select
                    label="Corridor"
                    value={routeDraft.corridorId}
                    onChange={(v) => updateRoute({ corridorId: v })}
                    options={CORRIDORS.map((c) => [c.id, c.name])}
                  />
                  <Input
                    label="Origin"
                    value={routeDraft.origin}
                    onChange={(v) => updateRoute({ origin: v })}
                  />
                  <Input
                    label="Destination"
                    value={routeDraft.destination}
                    onChange={(v) => updateRoute({ destination: v })}
                  />
                  <Input
                    label="Departure window"
                    value={routeDraft.departure}
                    onChange={(v) => updateRoute({ departure: v })}
                  />
                  <NumberInput
                    label="Seats"
                    value={routeDraft.seats}
                    min={1}
                    max={4}
                    onChange={(v) => updateRoute({ seats: v })}
                  />
                  <NumberInput
                    label="Max detour minutes"
                    value={routeDraft.maxDetour}
                    min={5}
                    max={30}
                    onChange={(v) => updateRoute({ maxDetour: v })}
                  />
                </div>

                <h3>Supported Safe Anchor Points</h3>
                <SafePicker
                  corridorId={routeDraft.corridorId}
                  selected={routeDraft.safePointIds}
                  onToggle={(pointId) => {
                    const exists = routeDraft.safePointIds.includes(pointId);
                    updateRoute({
                      safePointIds: exists
                        ? routeDraft.safePointIds.filter((x) => x !== pointId)
                        : [...routeDraft.safePointIds, pointId],
                    });
                  }}
                />

                <button className="primary" onClick={postRoute}>
                  Post Driver Route
                </button>

                <h3>Posted Routes</h3>
                <div className="list">
                  {routes.map((r) => (
                    <article className="item" key={r.id}>
                      <div className="itemTop">
                        <div>
                          <span className="pill">{r.status}</span>
                          <h3>{getCorridor(r.corridorId).name}</h3>
                          <p>
                            {r.origin} → {r.destination}
                          </p>
                        </div>
                        <strong>{r.seats} seats</strong>
                      </div>
                      <div className="chips">
                        <span>{r.departure}</span>
                        <span>Max detour: {r.maxDetour} min</span>
                        {r.safePointIds.map((sp) => (
                          <b key={sp}>{pointName(sp)}</b>
                        ))}
                      </div>
                      {r.status === "Posted" && (
                        <button
                          className="secondary"
                          onClick={() =>
                            setRoutes(
                              routes.map((x) =>
                                x.id === r.id ? { ...x, status: "Paused" } : x
                              )
                            )
                          }
                        >
                          Pause route
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </Panel>
            )}

            {tool === "Rider Bids" && (
              <Panel eyebrow="Rider demand" title="Post a rider bid signal">
                <div className="formGrid">
                  <Input
                    label="Rider name"
                    value={bidDraft.riderName}
                    onChange={(v) => updateBid({ riderName: v })}
                  />
                  <Select
                    label="Corridor"
                    value={bidDraft.corridorId}
                    onChange={(v) => updateBid({ corridorId: v })}
                    options={CORRIDORS.map((c) => [c.id, c.name])}
                  />
                  <Select
                    label="Pickup preference"
                    value={bidDraft.pickupPreference}
                    onChange={(v) => updateBid({ pickupPreference: v })}
                    options={[
                      ["Safe Anchor Point", "Safe Anchor Point"],
                      ["Nearby public point", "Nearby public point"],
                    ]}
                  />
                  <Select
                    label="Preferred Safe Anchor"
                    value={bidDraft.safePointId}
                    onChange={(v) => updateBid({ safePointId: v })}
                    options={pointsFor(bidDraft.corridorId).map((p) => [
                      p.id,
                      p.name,
                    ])}
                  />
                  <Select
                    label="Dropoff privacy"
                    value={bidDraft.dropoffPreference}
                    onChange={(v) => updateBid({ dropoffPreference: v })}
                    options={[
                      ["Safe Anchor Point", "Safe Anchor Point"],
                      ["Near my destination", "Near my destination"],
                      [
                        "Private destination after review",
                        "Private destination after review",
                      ],
                    ]}
                  />
                  <Input
                    label="Destination area shown to driver"
                    value={bidDraft.destinationArea}
                    onChange={(v) => updateBid({ destinationArea: v })}
                  />
                  <NumberInput
                    label="Bid signal"
                    value={bidDraft.bidSignal}
                    min={10}
                    max={80}
                    onChange={(v) => updateBid({ bidSignal: v })}
                  />
                  <Input
                    label="Time window"
                    value={bidDraft.timeWindow}
                    onChange={(v) => updateBid({ timeWindow: v })}
                  />
                </div>

                <div className="notice">
                  Bid signal only. No card charge, no wallet, no payment
                  authorization.
                </div>
                <button className="primary" onClick={postBid}>
                  Post Rider Bid
                </button>

                <h3>Rider Bids</h3>
                <div className="list">
                  {bids.map((b) => (
                    <article className="item" key={b.id}>
                      <div className="itemTop">
                        <div>
                          <span className="pill">{b.status}</span>
                          <h3>{b.riderName}</h3>
                          <p>{getCorridor(b.corridorId).name}</p>
                        </div>
                        <strong>{money(b.bidSignal)}</strong>
                      </div>
                      <div className="chips">
                        <span>{b.pickupPreference}</span>
                        <b>{pointName(b.safePointId)}</b>
                        <span>{b.dropoffPreference}</span>
                        <span>{b.destinationArea}</span>
                      </div>
                      {b.status === "Open" && (
                        <button
                          className="secondary"
                          onClick={() =>
                            setBids(
                              bids.map((x) =>
                                x.id === b.id ? { ...x, status: "Reviewed" } : x
                              )
                            )
                          }
                        >
                          Mark reviewed
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </Panel>
            )}

            {tool === "Corridors" && (
              <Panel
                eyebrow="Route selection"
                title="Choose the launch corridor"
              >
                <div className="corridorGrid">
                  {CORRIDORS.map((c) => (
                    <button
                      className={
                        selectedCorridor === c.id
                          ? "corridor selected"
                          : "corridor"
                      }
                      key={c.id}
                      onClick={() => setSelectedCorridor(c.id)}
                    >
                      <span className="pill">{c.phase}</span>
                      <h3>{c.name}</h3>
                      <p>{c.type}</p>
                      <strong>Demand: {c.demand}</strong>
                    </button>
                  ))}
                </div>
                <div className="detail">
                  <h3>{getCorridor(selectedCorridor).name}</h3>
                  <p>{getCorridor(selectedCorridor).type}</p>
                  <div className="chips">
                    {getCorridor(selectedCorridor).anchors.map((a) => (
                      <span key={a}>{a}</span>
                    ))}
                  </div>
                </div>
              </Panel>
            )}

            {tool === "Safe Anchor Points" && (
              <Panel
                eyebrow="Privacy-first pickup/dropoff"
                title="Safe Anchor Point preference"
              >
                <Select
                  label="View by corridor"
                  value={selectedCorridor}
                  onChange={setSelectedCorridor}
                  options={CORRIDORS.map((c) => [c.id, c.name])}
                />
                <div className="list">
                  {pointsFor(selectedCorridor).map((p) => (
                    <article className="item" key={p.id}>
                      <div className="itemTop">
                        <div>
                          <span className="pill">{p.type}</span>
                          <h3>{p.name}</h3>
                          <p>{p.details}</p>
                        </div>
                        <strong className="score">{p.score}</strong>
                      </div>
                      <div className="chips">
                        <span>{p.permission}</span>
                        <b>Default-safe candidate</b>
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>
            )}

            {tool === "EV Driver Profile" && (
              <Panel eyebrow="Driver verification" title="EV driver profile">
                <div className="profile">
                  <div className="avatar">EV</div>
                  <div>
                    <h2>{profile.name}</h2>
                    <p>
                      {profile.vehicle} · {profile.rangeMiles} mi range ·{" "}
                      {profile.connector}
                    </p>
                  </div>
                  <span className={profile.verifiedEV ? "good" : "bad"}>
                    {profile.verifiedEV
                      ? "EV Verified"
                      : "Needs EV Verification"}
                  </span>
                </div>

                <div className="formGrid">
                  <Input
                    label="Driver name"
                    value={profile.name}
                    onChange={(v) => setProfile({ ...profile, name: v })}
                  />
                  <Input
                    label="Vehicle"
                    value={profile.vehicle}
                    onChange={(v) => setProfile({ ...profile, vehicle: v })}
                  />
                  <Input
                    label="Connector"
                    value={profile.connector}
                    onChange={(v) => setProfile({ ...profile, connector: v })}
                  />
                  <NumberInput
                    label="Range miles"
                    value={profile.rangeMiles}
                    min={40}
                    max={400}
                    onChange={(v) => setProfile({ ...profile, rangeMiles: v })}
                  />
                  <Select
                    label="EV verification"
                    value={profile.verifiedEV ? "true" : "false"}
                    onChange={(v) =>
                      setProfile({ ...profile, verifiedEV: v === "true" })
                    }
                    options={[
                      ["true", "Verified"],
                      ["false", "Not verified"],
                    ]}
                  />
                  <NumberInput
                    label="Preferred max detour"
                    value={profile.maxDetour}
                    min={5}
                    max={30}
                    onChange={(v) => setProfile({ ...profile, maxDetour: v })}
                  />
                </div>

                <div className="grid3">
                  <Card title="License" body={profile.license} />
                  <Card title="Insurance" body={profile.insurance} />
                  <Card title="Background" body={profile.background} />
                </div>
              </Panel>
            )}

            {tool === "Match Board" && (
              <Panel eyebrow="Route compatibility" title="Match score board">
                {matches.length === 0 ? (
                  <div className="empty">No open route/bid matches yet.</div>
                ) : (
                  <div className="list">
                    {matches.map((m) => (
                      <article
                        className={
                          selectedMatch?.id === m.id
                            ? "item selectedItem"
                            : "item"
                        }
                        key={m.id}
                        onClick={() => setSelectedMatch(m)}
                      >
                        <div className="itemTop">
                          <div>
                            <span className={m.score >= 88 ? "good" : "pill"}>
                              {m.label}
                            </span>
                            <h3>
                              {m.route.driverName} → {m.bid.riderName}
                            </h3>
                            <p>{getCorridor(m.route.corridorId).name}</p>
                          </div>
                          <strong className="score">{m.score}</strong>
                        </div>
                        <div className="chips">
                          <b>{m.pilotGate}</b>
                          <span>Confidence {m.confidence}/100</span>
                          {m.riskFlags.slice(0, 2).map((flag) => (
                            <span key={flag}>{flag}</span>
                          ))}
                        </div>
                        <div className="split">
                          <div>
                            <b>Driver route</b>
                            <p>
                              {m.route.origin} → {m.route.destination}
                            </p>
                            <p>{m.route.departure}</p>
                          </div>
                          <div>
                            <b>Rider bid</b>
                            <p>
                              {money(m.bid.bidSignal)} · {m.bid.timeWindow}
                            </p>
                            <p>{m.bid.destinationArea}</p>
                          </div>
                        </div>
                        <div className="chips">
                          {m.reasons.map((r) => (
                            <span key={r}>{r}</span>
                          ))}
                        </div>
                        <div className="notice">
                          Review only. This match cannot be activated as a live
                          ride in V2.
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </Panel>
            )}

            {tool === "Engineering Console" && (
              <Panel
                eyebrow="MIT-style systems view"
                title="Explainable relay engineering console"
              >
                <div className="notice">
                  This console treats Relay Rider as a planning system:
                  weighted scoring, confidence, safety gates, traffic pressure,
                  parking pressure, and partner readiness. It still does not
                  activate live rides.
                </div>

                <h3>Scoring weights</h3>
                <div className="grid4">
                  {Object.entries(SCORE_WEIGHTS).map(([key, value]) => (
                    <Stat
                      key={key}
                      label={key.replace(/([A-Z])/g, " $1")}
                      value={Math.round(value * 100) + "%"}
                    />
                  ))}
                </div>

                <h3>Corridor readiness</h3>
                <div className="list">
                  {readiness.map((row) => (
                    <article className="item" key={row.corridorId}>
                      <div className="itemTop">
                        <div>
                          <span
                            className={row.readiness >= 76 ? "good" : "pill"}
                          >
                            Readiness {row.readiness}/100
                          </span>
                          <h3>{getCorridor(row.corridorId).name}</h3>
                          <p>
                            {row.routeCount} routes · {row.bidCount} bids ·{" "}
                            {row.matchCount} compatible matches
                          </p>
                        </div>
                        <strong className="score">{row.readiness}</strong>
                      </div>
                      <div className="chips">
                        <span>Anchor readiness {row.anchorReadiness}</span>
                        <span>Traffic opportunity {row.trafficOpportunity}</span>
                        <span>Parking pressure {row.parkingPressure}</span>
                        <span>Supply/demand {row.supplyDemandBalance}</span>
                        <b>Avg match {row.avgMatch}</b>
                      </div>
                    </article>
                  ))}
                </div>

                <h3>Selected match diagnostics</h3>
                {selectedMatch ? (
                  <div className="detail">
                    <div className="itemTop">
                      <div>
                        <span
                          className={
                            selectedMatch.pilotGate === "Pilot review ready"
                              ? "good"
                              : "pill"
                          }
                        >
                          {selectedMatch.pilotGate}
                        </span>
                        <h3>
                          {selectedMatch.route.driverName} →{" "}
                          {selectedMatch.bid.riderName}
                        </h3>
                        <p>
                          Score {selectedMatch.score}/100 · Confidence{" "}
                          {selectedMatch.confidence}/100
                        </p>
                      </div>
                      <strong className="score">{selectedMatch.score}</strong>
                    </div>
                    <div className="componentGrid">
                      {Object.entries(selectedMatch.parts).map(([key, value]) => (
                        <div className="component" key={key}>
                          <span>{key.replace(/([A-Z])/g, " $1")}</span>
                          <b>{Math.round(value)}</b>
                          <i style={{ width: `${Math.round(value)}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className="chips">
                      {selectedMatch.riskFlags.length ? (
                        selectedMatch.riskFlags.map((flag) => (
                          <span key={flag}>{flag}</span>
                        ))
                      ) : (
                        <b>No major risk flags</b>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="empty">
                    Select a match from Sonar or the Match Board to see
                    diagnostics.
                  </div>
                )}

                <h3>Partner readiness signals</h3>
                <div className="grid3">
                  {PARTNER_SIGNALS.map((partner) => (
                    <article className="card" key={partner.id}>
                      <h3>{partner.type}</h3>
                      <p>{partner.nextStep}</p>
                      <div className="chips">
                        <span>Demand {partner.demand}</span>
                        <span>Parking {partner.parking}</span>
                        <span>EV coverage {partner.evCoverage}</span>
                        <b>Anchors {partner.anchorReadiness}</b>
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>
            )}

            {tool === "Admin Dashboard" && (
              <Panel eyebrow="Operations" title="Admin dashboard">
                <div className="grid6">
                  <Stat label="Routes Posted" value={routes.length} />
                  <Stat
                    label="Open Bids"
                    value={bids.filter((b) => b.status === "Open").length}
                  />
                  <Stat
                    label="Reviewed Bids"
                    value={bids.filter((b) => b.status === "Reviewed").length}
                  />
                  <Stat
                    label="Avg Match"
                    value={
                      matches.length
                        ? Math.round(
                            matches.reduce((s, m) => s + m.score, 0) /
                              matches.length
                          ) + "%"
                        : "0%"
                    }
                  />
                  <Stat
                    label="EV Verified"
                    value={profile.verifiedEV ? "Yes" : "No"}
                  />
                  <Stat
                    label="Pilot Ready"
                    value={
                      matches.filter((m) => m.pilotGate === "Pilot review ready")
                        .length
                    }
                  />
                  <Stat
                    label="Avg Readiness"
                    value={
                      readiness.length
                        ? Math.round(
                            readiness.reduce((sum, row) => sum + row.readiness, 0) /
                              readiness.length
                          ) + "%"
                        : "0%"
                    }
                  />
                  <Stat
                    label="Risk Flags"
                    value={matches.reduce((sum, m) => sum + m.riskFlags.length, 0)}
                  />
                  <Stat label="Mode" value="Planning" />
                </div>
                <div className="notice">
                  <strong>Admin note:</strong> {adminNote}
                </div>
                <div className="reviewTable">
                  <b>Item</b>
                  <b>Status</b>
                  <b>Action Needed</b>
                  <span>Driver verification</span>
                  <span>{profile.background}</span>
                  <span>Background check before activation</span>
                  <span>Safe Anchor permissions</span>
                  <span>Pending</span>
                  <span>Review campus/public site rules</span>
                  <span>Payments</span>
                  <span>Disabled</span>
                  <span>Not in V2 scope</span>
                  <span>Live ride activation</span>
                  <span>Disabled</span>
                  <span>Requires insurance/legal readiness</span>
                </div>
              </Panel>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

function MatchSummary({ match }) {
  return (
    <div className="matchSummary">
      <span className={match.score >= 88 ? "good" : "pill"}>
        {match.label} match
      </span>
      <h3>
        {match.route.driverName} can serve {match.bid.riderName}
      </h3>
      <p>{getCorridor(match.route.corridorId).name}</p>
      <div className="chips">
        <b>{match.pilotGate}</b>
        <span>Confidence {match.confidence}/100</span>
      </div>
      <div className="chips">
        {match.reasons.map((r) => (
          <span key={r}>{r}</span>
        ))}
      </div>
      <div className="notice">
        Planning review only. No payment and no live ride activation.
      </div>
    </div>
  );
}

function Panel({ eyebrow, title, children }) {
  return (
    <div className="panel">
      <span className="eyebrow small">{eyebrow}</span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function Card({ title, body }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <label>
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function NumberInput({ label, value, onChange, min, max }) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(e.target.value, min, max))}
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function SafePicker({ corridorId, selected, onToggle }) {
  return (
    <div className="safePicker">
      {pointsFor(corridorId).map((p) => (
        <button
          key={p.id}
          className={selected.includes(p.id) ? "safe activeSafe" : "safe"}
          onClick={() => onToggle(p.id)}
        >
          <b>{p.name}</b>
          <span>
            {p.score}/100 · {p.type}
          </span>
        </button>
      ))}
    </div>
  );
}

const css = `
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; }
.app {
  min-height: 100vh;
  color: #fff;
  background:
    radial-gradient(circle at 18% 12%, rgba(0,122,255,.18), transparent 32%),
    radial-gradient(circle at 88% 10%, rgba(25,195,125,.16), transparent 34%),
    linear-gradient(180deg,#080a14 0%,#0d1222 52%,#05060b 100%);
  font-family: Inter, Arial, Helvetica, sans-serif;
}
header {
  position: sticky; top: 0; z-index: 10;
  padding: 18px 5%;
  display: flex; justify-content: space-between; align-items: center; gap: 18px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  background: rgba(7,9,20,.86); backdrop-filter: blur(14px);
}
.brand { display: flex; align-items: center; gap: 12px; }
.brand p { margin: 3px 0 0; color: #9aa3bf; font-size: 13px; }
.mark {
  width: 42px; height: 42px; border-radius: 14px;
  display: grid; place-items: center; font-weight: 950; color: #0d0d0d;
  background: linear-gradient(135deg,#007aff,#ffc107);
}
.toolMenu { display: grid; gap: 6px; color: #c2c8dc; font-size: 12px; font-weight: 900; }
.toolMenu select, input, select {
  background: rgba(0,0,0,.26); color: white;
  border: 1px solid rgba(255,255,255,.12); border-radius: 14px;
  padding: 12px 13px; font-size: 15px; outline: none; width: 100%;
}
button:disabled { opacity: .55; cursor: not-allowed; }
main { padding: 28px 5% 60px; display: grid; gap: 22px; }
.hero { display: grid; grid-template-columns: 1.1fr .9fr; gap: 22px; align-items: stretch; }
.eyebrow {
  display: inline-flex; padding: 7px 12px; border-radius: 999px;
  background: rgba(25,195,125,.1); color: #b7ffdc; font-weight: 900; margin-bottom: 12px;
}
.eyebrow.small { font-size: 12px; }
h1 { font-size: clamp(2.4rem,5vw,5rem); line-height: .94; letter-spacing: -.07em; margin: 0 0 14px; }
.subtitle { color: #c2c8dc; line-height: 1.5; max-width: 850px; }
.stats, .panel, aside {
  background: rgba(255,255,255,.065);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 28px;
  box-shadow: 0 18px 44px rgba(0,0,0,.18);
}
.stats { padding: 20px; display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
.stat, .card {
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 20px; padding: 15px;
}
.stat span { display: block; color: #9aa3bf; font-size: 12px; text-transform: uppercase; font-weight: 900; }
.stat strong { display: block; font-size: 28px; margin-top: 4px; color: #19c37d; }
.layout { display: grid; grid-template-columns: 260px 1fr; gap: 22px; }
aside { padding: 14px; display: grid; gap: 8px; align-self: start; position: sticky; top: 100px; }
.nav {
  border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.04);
  color: #c2c8dc; border-radius: 16px; padding: 12px 14px;
  cursor: pointer; text-align: left; font-weight: 900;
}
.nav.active { border-color: rgba(25,195,125,.42); background: rgba(25,195,125,.12); color: white; }
.panel { padding: 22px; }
.panel h2 { font-size: clamp(1.8rem,3vw,3.2rem); line-height: 1; letter-spacing: -.055em; margin: 0 0 20px; }
.grid3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
.grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 18px; }
.grid6 { display: grid; grid-template-columns: repeat(6,1fr); gap: 12px; margin-bottom: 16px; }
.formGrid { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; margin-bottom: 18px; }
label { display: grid; gap: 7px; color: #c2c8dc; font-weight: 900; font-size: 13px; }
.safePicker, .corridorGrid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 18px; }
.safe, .corridor {
  border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.05);
  color: #c2c8dc; border-radius: 18px; padding: 14px; text-align: left; cursor: pointer;
  display: grid; gap: 5px;
}
.activeSafe, .corridor.selected { border-color: rgba(25,195,125,.42); background: rgba(25,195,125,.12); color: white; }
.primary {
  border: 0; border-radius: 18px; padding: 15px 18px; width: 100%;
  background: linear-gradient(135deg,#19c37d,#ffc107);
  color: #0d0d0d; font-weight: 950; cursor: pointer; font-size: 16px;
}
.primary.compact { width: auto; min-width: 150px; height: 46px; padding: 0 16px; align-self: end; }
.secondary {
  border: 1px solid rgba(255,255,255,.12); border-radius: 16px; padding: 11px 13px;
  background: rgba(255,255,255,.07); color: white; cursor: pointer; font-weight: 900; margin-top: 12px;
}
.notice {
  border: 1px solid rgba(255,193,7,.28); background: rgba(255,193,7,.07);
  border-radius: 18px; padding: 14px; color: #ffe58c; margin: 16px 0;
}
.list { display: grid; gap: 12px; }
.item, .detail, .profile, .matchSummary, .sonarPanel {
  background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.12);
  border-radius: 22px; padding: 16px;
}
.selectedItem { border-color: rgba(25,195,125,.42); background: rgba(25,195,125,.08); }
.itemTop { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; }
.item h3, .corridor h3, .card h3, .matchSummary h3 { margin: 10px 0 5px; }
.item p, .corridor p, .card p, .profile p, .matchSummary p, .sonarPanel p { color: #9aa3bf; margin: 0; line-height: 1.45; }
.pill, .good, .bad {
  display: inline-flex; border-radius: 999px; padding: 6px 10px;
  font-size: 12px; font-weight: 900; border: 1px solid rgba(255,255,255,.12);
  color: #c2c8dc; background: rgba(255,255,255,.08);
}
.good { border-color: rgba(25,195,125,.34); color: #b7ffdc; background: rgba(25,195,125,.12); }
.bad { border-color: rgba(255,59,48,.34); color: #ffb0aa; background: rgba(255,59,48,.12); }
.chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
.chips span, .chips b {
  border-radius: 999px; padding: 6px 9px; background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.09); color: #c2c8dc; font-size: 12px; font-weight: 800;
}
.chips b { background: rgba(25,195,125,.12); color: #b7ffdc; border-color: rgba(25,195,125,.25); }
.score {
  width: 64px; height: 64px; border-radius: 18px; display: grid; place-items: center;
  background: rgba(25,195,125,.12); border: 1px solid rgba(25,195,125,.28);
  color: #b7ffdc; font-weight: 950; font-size: 20px;
}
.profile { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.avatar {
  width: 68px; height: 68px; border-radius: 22px; display: grid; place-items: center;
  background: linear-gradient(135deg,#fff,#19c37d); color: #0d0d0d; font-weight: 950;
}
.split { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; margin-top: 14px; }
.componentGrid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-top: 14px; }
.component {
  display: grid; gap: 6px; padding: 12px; border-radius: 16px;
  background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.1);
}
.component span {
  color: #9aa3bf; font-size: 12px; font-weight: 900; text-transform: capitalize;
}
.component b { color: #b7ffdc; font-size: 20px; }
.component i {
  display: block; height: 7px; border-radius: 999px;
  background: linear-gradient(90deg,#19c37d,#007aff);
}
.reviewTable {
  display: grid; grid-template-columns: 1fr 1fr 1.4fr; border-radius: 18px; overflow: hidden;
  border: 1px solid rgba(255,255,255,.12);
}
.reviewTable > * { padding: 14px; border-bottom: 1px solid rgba(255,255,255,.08); }
.reviewTable b { background: rgba(255,255,255,.08); }
.empty { padding: 22px; color: #9aa3bf; }
.mapControls { display: grid; grid-template-columns: 1fr 1fr auto; gap: 14px; margin-bottom: 14px; align-items: end; }
.mapShell { position: relative; height: 560px; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04); margin-bottom: 16px; }
.mapNode { width: 100%; height: 100%; }
.mapLegend {
  position: absolute; left: 14px; bottom: 14px; z-index: 500;
  display: flex; flex-wrap: wrap; gap: 8px;
  border-radius: 16px; padding: 10px 12px;
  background: rgba(7,9,20,.86); border: 1px solid rgba(255,255,255,.12);
}
.mapLegend span { font-size: 12px; color: #c2c8dc; display: flex; align-items: center; gap: 6px; }
.mapLegend i { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.twoCol { display: grid; grid-template-columns: .9fr 1.1fr; gap: 18px; align-items: start; }
.panelHead { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.sonarSvg {
  width: 100%; height: 360px; border-radius: 22px; border: 1px solid rgba(255,255,255,.12);
  background: rgba(0,0,0,.16); margin-top: 14px;
}
.sweep { transform-origin: 50px 50px; }
.sweep.scanning { animation: sweep 2.2s linear infinite; }
@keyframes sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.sonarResults { display: grid; gap: 8px; margin-top: 12px; }
.sonarMatch {
  border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.05); color: white;
  border-radius: 16px; padding: 12px; text-align: left; display: grid; gap: 4px; cursor: pointer;
}
.sonarMatch.selected { border-color: rgba(25,195,125,.42); background: rgba(25,195,125,.12); }
.sonarMatch span { color: #b7ffdc; font-weight: 900; }
.sonarMatch small, .muted { color: #9aa3bf; }
@media (max-width: 1180px) {
  .hero, .layout, .grid4, .grid6, .twoCol, .mapControls { grid-template-columns: 1fr; }
  aside { position: static; }
  .primary.compact { width: 100%; }
}
@media (max-width: 760px) {
  header { position: static; align-items: flex-start; flex-direction: column; }
  .formGrid, .safePicker, .corridorGrid, .grid3, .componentGrid, .split, .stats { grid-template-columns: 1fr; }
  .mapShell { height: 460px; }
}
`;

export default App;
