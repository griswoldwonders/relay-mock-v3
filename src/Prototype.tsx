import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import L, { type Map as LeafletMap, type TileLayer } from "leaflet";
import { Cross2Icon, LayersIcon, SewingPinIcon } from "@radix-ui/react-icons";
import { useKeyboard } from "./mobile";
import PrototypePhase1 from "./PrototypePhase1";
import "leaflet/dist/leaflet.css";
import "./prototype.css";

type Experience = "institution" | "participant";
type AdminGroup = "overview" | "intelligence" | "exchange" | "program" | "reporting" | "admin";
type AdminView =
  | "overview"
  | "demand"
  | "corridors"
  | "parking"
  | "ev"
  | "map"
  | "exchange"
  | "needs"
  | "routes"
  | "matches"
  | "access"
  | "participants"
  | "cohorts"
  | "review"
  | "credits"
  | "rules"
  | "tdm"
  | "parking-report"
  | "sustainability"
  | "rule2202"
  | "exports"
  | "institution"
  | "sites"
  | "users"
  | "permissions"
  | "data";

type MapTag = "demand" | "planned" | "access" | "parking" | "ev" | "transit" | "institution";
type MapFilter = "all" | MapTag;
type TileStatus = "loading" | "ready" | "fallback" | "error";
type ContributionState = "Draft" | "Submitted" | "Compatible" | "Needs Review" | "Accepted for Review" | "Declined" | "Expired";
type ReviewState = "Pending" | "Accepted for Review" | "Declined";

type CorridorPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tags: MapTag[];
  label: string;
  status: string;
  detail: string;
  emphasis?: "transfer" | "pressure";
};

type MatchPreview = {
  id: string;
  corridor: string;
  compatibility: number;
  routeFit: number;
  scheduleFit: string;
  detour: string;
  overlap: string;
  accessPoint: string;
  contribution: string;
  ev: string;
  eligibility: string;
  accessibility: string;
  review: string;
  reasons: string[];
};

type LedgerRecord = {
  participantId: string;
  date: string;
  origin: string;
  destination: string;
  baseline: string;
  reported: string;
  ev: string;
  accessPoint: string;
  parking: string;
  confidence: string;
};

const NAV_GROUPS: { id: AdminGroup; label: string; items: { id: AdminView; label: string }[] }[] = [
  { id: "overview", label: "Overview", items: [{ id: "overview", label: "Program Console Home" }] },
  {
    id: "intelligence",
    label: "Mobility Intelligence",
    items: [
      { id: "demand", label: "Commute Demand" },
      { id: "corridors", label: "Corridors" },
      { id: "parking", label: "Parking" },
      { id: "ev", label: "EV / Charging" },
      { id: "map", label: "Map" },
    ],
  },
  {
    id: "exchange",
    label: "Corridor Exchange",
    items: [
      { id: "exchange", label: "Explore Options" },
      { id: "needs", label: "Commute Needs" },
      { id: "routes", label: "Planned Routes" },
      { id: "matches", label: "Match Previews" },
      { id: "access", label: "Access Points" },
    ],
  },
  {
    id: "program",
    label: "Program",
    items: [
      { id: "participants", label: "Participants" },
      { id: "cohorts", label: "Cohorts" },
      { id: "review", label: "Review Queue" },
      { id: "credits", label: "Green Route Credits" },
      { id: "rules", label: "Program Rules" },
    ],
  },
  {
    id: "reporting",
    label: "Reporting",
    items: [
      { id: "tdm", label: "TDM Dashboard" },
      { id: "parking-report", label: "Parking Report" },
      { id: "sustainability", label: "Sustainability" },
      { id: "rule2202", label: "Rule 2202 Readiness" },
      { id: "exports", label: "Exports / Ledger" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    items: [
      { id: "institution", label: "Institution" },
      { id: "sites", label: "Sites" },
      { id: "users", label: "Users" },
      { id: "permissions", label: "Permissions" },
      { id: "data", label: "Data Settings" },
    ],
  },
];

const GROUP_DEFAULTS: Record<AdminGroup, AdminView> = {
  overview: "overview",
  intelligence: "demand",
  exchange: "exchange",
  program: "participants",
  reporting: "tdm",
  admin: "institution",
};

const CORRIDOR_POINTS: CorridorPoint[] = [
  {
    id: "glendale-demand-zone",
    name: "Central Glendale origin zone",
    lat: 34.1469,
    lng: -118.2551,
    tags: ["demand"],
    label: "Generalized commuter origin zone",
    status: "DEMO DATA · approximate zone only",
    detail: "Generalized zone representing modeled commuter demand. It does not identify a participant home location.",
  },
  {
    id: "eagle-rock-demand-zone",
    name: "Eagle Rock origin zone",
    lat: 34.1396,
    lng: -118.2078,
    tags: ["demand"],
    label: "Generalized commuter origin zone",
    status: "DEMO DATA · approximate zone only",
    detail: "Modeled origin-zone demand used for corridor opportunity detection and parking-pressure scenarios.",
  },
  {
    id: "glendale-transit-center",
    name: "Glendale Transportation Center",
    lat: 34.1236,
    lng: -118.2587,
    tags: ["access", "transit"],
    label: "Regional transit + Access Point candidate",
    status: "Candidate · administrative review required",
    detail: "Regional rail and bus anchor near the west end of the Pasadena–Eagle Rock–Glendale research corridor.",
  },
  {
    id: "eagle-rock-plaza",
    name: "Eagle Rock Plaza public edge",
    lat: 34.1399,
    lng: -118.2248,
    tags: ["access"],
    label: "Access Point candidate",
    status: "Candidate · site suitability review required",
    detail: "Public-facing corridor anchor used in the prototype to study low-detour meeting-point compatibility.",
  },
  {
    id: "del-mar",
    name: "Del Mar Station",
    lat: 34.14199,
    lng: -118.14821,
    tags: ["transit", "access"],
    label: "Metro A Line station",
    status: "Transit anchor · PCC shuttle connection not implied",
    detail: "Pasadena A Line station included for multimodal commuter-option previews and approximate-zone coordination.",
  },
  {
    id: "memorial-park",
    name: "Memorial Park Station",
    lat: 34.14848,
    lng: -118.14746,
    tags: ["transit", "access"],
    label: "Metro A Line station",
    status: "Transit anchor · PCC shuttle connection not implied",
    detail: "Central Pasadena A Line station for rail-linked commute previews. Relay Rider does not label it as a PCC shuttle stop.",
  },
  {
    id: "lake-station",
    name: "Lake Station",
    lat: 34.15181,
    lng: -118.13212,
    tags: ["transit"],
    label: "Metro A Line station",
    status: "Transit anchor · PCC shuttle connection not implied",
    detail: "Pasadena A Line station shown as a nearby rail option for institution-focused commute planning.",
  },
  {
    id: "allen-station",
    name: "Allen Station · PCC Shuttle Connection",
    lat: 34.15244,
    lng: -118.11356,
    tags: ["transit", "access"],
    label: "PCC Shuttle + Metro A Line transfer hub",
    status: "Published PCC shuttle connection · program eligibility applies",
    detail: "PCC identifies curbside boarding in front of Allen Station at the PCC Shuttle Stop sign. This is the primary rail-to-campus transfer hub in the prototype.",
    emphasis: "transfer",
  },
  {
    id: "sierra-madre-villa",
    name: "Sierra Madre Villa Station",
    lat: 34.14846,
    lng: -118.08149,
    tags: ["transit"],
    label: "Metro A Line station",
    status: "Transit anchor · PCC shuttle connection not implied",
    detail: "East Pasadena A Line station included for multimodal access and corridor-demand context.",
  },
  {
    id: "pcc-colorado-shuttle",
    name: "PCC Colorado Campus · Lots 6 & 7",
    lat: 34.14515,
    lng: -118.11695,
    tags: ["transit", "institution", "access"],
    label: "PCC Shuttle boarding area",
    status: "Published boarding area · approximate map pin",
    detail: "PCC describes the Colorado Campus shuttle stop on the northeast side of campus between parking lots 6 and 7. The pin is approximate rather than a surveyed curb location.",
  },
  {
    id: "pcc-foothill-shuttle",
    name: "PCC Foothill Campus · Lot C",
    lat: 34.15072,
    lng: -118.08644,
    tags: ["transit", "institution", "access"],
    label: "PCC Shuttle boarding area",
    status: "Published boarding area · approximate campus pin",
    detail: "PCC identifies Parking Lot C as the Foothill Campus shuttle boarding area. The prototype pin represents the campus/lot area, not a surveyed curb position.",
  },
  {
    id: "pcc-jefferson",
    name: "PCC Jefferson Training Center",
    lat: 34.15492,
    lng: -118.11881,
    tags: ["institution", "transit"],
    label: "PCC-affiliated shuttle-network site",
    status: "Boarding location pending confirmation",
    detail: "PCC identifies Jefferson as part of its shuttle-served campus network, but the current transportation page does not publish a precise Jefferson boarding point. This pin represents the site only.",
  },
  {
    id: "pcc-lot-5",
    name: "PCC Lot 5 area",
    lat: 34.14436,
    lng: -118.11634,
    tags: ["parking", "ev", "institution"],
    label: "Parking + charging context",
    status: "DEMO PARKING METRIC · institutional charging context",
    detail: "Parking-pressure and charging-demand demonstration point. Charging access should not be assumed public without institution rules.",
    emphasis: "pressure",
  },
  {
    id: "caltech",
    name: "Caltech",
    lat: 34.1377,
    lng: -118.1253,
    tags: ["institution"],
    label: "Institution anchor",
    status: "Research anchor · no partnership implied",
    detail: "Institutional anchor included for corridor research and future employer/campus TDM analysis.",
  },
  {
    id: "huntington-hospital",
    name: "Huntington Hospital",
    lat: 34.1336,
    lng: -118.1527,
    tags: ["institution"],
    label: "Healthcare anchor",
    status: "Research anchor · no pickup approval implied",
    detail: "Healthcare destination anchor relevant to shift-based commute demand and parking-pressure analysis.",
  },
  {
    id: "glendale-community-college",
    name: "Glendale Community College",
    lat: 34.1667,
    lng: -118.228,
    tags: ["institution"],
    label: "Institution anchor",
    status: "Research anchor · no partnership implied",
    detail: "Campus anchor used to visualize institutionally relevant commute demand around the Glendale side of the corridor.",
  },
];

const PLANNED_ROUTE_LINES: [number, number][][] = [
  [
    [34.1469, -118.2551],
    [34.1399, -118.2248],
    [34.1462, -118.196],
    [34.14848, -118.14746],
    [34.14515, -118.11695],
  ],
  [
    [34.1396, -118.2078],
    [34.14848, -118.14746],
    [34.14515, -118.11695],
  ],
];

const A_LINE_STATION_SPINE: [number, number][] = [
  [34.14199, -118.14821],
  [34.14848, -118.14746],
  [34.15181, -118.13212],
  [34.15244, -118.11356],
  [34.14846, -118.08149],
];

const PCC_SHUTTLE_LINE: [number, number][] = [
  [34.14515, -118.11695],
  [34.15244, -118.11356],
  [34.15072, -118.08644],
];

const FILTERS: { id: MapFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "demand", label: "Demand" },
  { id: "planned", label: "Planned Routes" },
  { id: "access", label: "Access Points" },
  { id: "parking", label: "Parking Pressure" },
  { id: "ev", label: "EV Charging" },
  { id: "transit", label: "Transit" },
  { id: "institution", label: "Institutions" },
];

const MARKER_COLORS: Record<MapTag, string> = {
  demand: "#a34e86",
  planned: "#6555d8",
  access: "#6555d8",
  parking: "#c05848",
  ev: "#278762",
  transit: "#2674b8",
  institution: "#2f7a52",
};

const DEMO_KPIS = [
  ["Active Participants", "412", "DEMO DATA"],
  ["Commute Profiles", "568", "DEMO DATA"],
  ["Planned Routes", "74", "DEMO DATA"],
  ["Compatible Options", "129", "SIMULATED"],
  ["Parking Pressure", "High", "MODELED"],
  ["EV / Hybrid", "28%", "DEMO DATA"],
  ["Access Point Willing", "61%", "DEMO DATA"],
  ["SOV Trips Affected", "83", "ESTIMATED"],
];

const ALERTS = [
  ["High unmatched demand", "Eagle Rock → Pasadena", "17 commuters share Tuesday / Thursday arrival windows."],
  ["Parking pressure", "Main Campus", "Modeled peak demand exceeds the demonstration threshold from 7:30–9:00 AM."],
  ["Access Point review", "Memorial Park", "Capacity and institution-policy review recommended before designation."],
  ["Green Route Credits", "Sample Program", "72% of the demonstration allocation is reserved or approved."],
];

const CORRIDORS = [
  { name: "Glendale → Pasadena", demand: 142, supply: 31, previews: 58, detour: "5.8 min", access: "72%", parking: "High", ev: "31%", status: "Active analysis" },
  { name: "Eagle Rock → Pasadena", demand: 96, supply: 18, previews: 37, detour: "4.6 min", access: "66%", parking: "High", ev: "24%", status: "Supply gap" },
  { name: "East Pasadena → PCC", demand: 121, supply: 16, previews: 22, detour: "3.9 min", access: "54%", parking: "Moderate", ev: "34%", status: "Transit opportunity" },
];

const PARKING = [
  { name: "PCC Lot 5", capacity: 420, occupancy: 94, peak: "7:30–9:00 AM", solo: 184, routes: 27, candidates: 61, ev: 23, access: 4, pressure: "CRITICAL" },
  { name: "PCC Lot 4", capacity: 310, occupancy: 86, peak: "8:00–9:30 AM", solo: 131, routes: 19, candidates: 42, ev: 18, access: 3, pressure: "HIGH" },
  { name: "Foothill Campus", capacity: 260, occupancy: 73, peak: "8:30–10:00 AM", solo: 88, routes: 12, candidates: 29, ev: 27, access: 2, pressure: "MODERATE" },
];

const INTERVENTIONS: Record<string, { participants: number; spaces: number; cost: string; matches: number; sov: string }> = {
  "Priority carpool parking": { participants: 48, spaces: 18, cost: "$4,800", matches: 24, sov: "-3.8 pts" },
  "Green Route Credits": { participants: 72, spaces: 24, cost: "$9,600", matches: 31, sov: "-5.1 pts" },
  "Transit incentive": { participants: 64, spaces: 21, cost: "$8,200", matches: 0, sov: "-4.4 pts" },
  "Access Point promotion": { participants: 55, spaces: 17, cost: "$3,100", matches: 26, sov: "-3.2 pts" },
  "Schedule-flexibility campaign": { participants: 91, spaces: 15, cost: "$2,400", matches: 19, sov: "-2.7 pts" },
  "EV corridor campaign": { participants: 38, spaces: 6, cost: "$5,500", matches: 12, sov: "-1.1 pts" },
};

const MATCH_PREVIEWS: MatchPreview[] = [
  {
    id: "MP-1042",
    corridor: "Eagle Rock → PCC Colorado Campus",
    compatibility: 86,
    routeFit: 84,
    scheduleFit: "25 min overlap",
    detour: "6 min estimated",
    overlap: "84% modeled route overlap",
    accessPoint: "Memorial Park · compatible",
    contribution: "$5 signal · within review range",
    ev: "Hybrid planned route",
    eligibility: "Same demonstration institution / Staff cohort",
    accessibility: "No conflict indicated in demo record",
    review: "Administrative review required",
    reasons: [
      "Commute windows overlap by approximately 25 minutes.",
      "84% of the modeled corridor follows the participant's existing planned route.",
      "Estimated added detour is 6 minutes.",
      "Both demonstration records selected Memorial Park as an acceptable Access Point.",
      "The proposed contribution signal falls within the planned-route participant's review range.",
      "Both demonstration records are assigned to the same sample institutional commuter program.",
    ],
  },
  {
    id: "MP-1047",
    corridor: "Glendale → PCC Colorado Campus",
    compatibility: 79,
    routeFit: 76,
    scheduleFit: "18 min overlap",
    detour: "8 min estimated",
    overlap: "76% modeled route overlap",
    accessPoint: "Eagle Rock Plaza · compatible",
    contribution: "$3 signal · compatible",
    ev: "EV planned route",
    eligibility: "Same demonstration institution / mixed cohort",
    accessibility: "Access Point review pending",
    review: "Needs Review",
    reasons: [
      "Recurring Tuesday / Thursday schedules overlap.",
      "The modeled corridor shares 76% of the registered planned route.",
      "Estimated detour remains within the route participant's 10-minute limit.",
      "Both records allow a public Access Point near Eagle Rock Plaza.",
      "EV preference is compatible with the registered planned-route vehicle signal.",
    ],
  },
];

const ACCESS_POINTS = [
  { name: "Memorial Park Station", type: "Transit station", corridors: "Pasadena core", transit: "Metro A Line", ev: "Nearby context", lighting: "Review recorded", visibility: "Review recorded", accessibility: "Review pending", approval: "Candidate" },
  { name: "Allen Station", type: "Transit / shuttle hub", corridors: "East Pasadena / PCC", transit: "A Line + PCC shuttle", ev: "Nearby context", lighting: "Public station context", visibility: "Public station context", accessibility: "Verify program needs", approval: "Transit anchor" },
  { name: "Eagle Rock Plaza public edge", type: "Retail center", corridors: "Glendale / Eagle Rock", transit: "Bus context", ev: "Not configured", lighting: "Review required", visibility: "Review required", accessibility: "Review required", approval: "Candidate" },
];

const LEDGER: LedgerRecord[] = [
  { participantId: "DEMO-0017", date: "2026-08-03", origin: "Central Glendale", destination: "PCC Main", baseline: "Drive alone", reported: "Carpool", ev: "Hybrid", accessPoint: "Eagle Rock", parking: "No", confidence: "Demonstration" },
  { participantId: "DEMO-0034", date: "2026-08-04", origin: "Eagle Rock", destination: "PCC Main", baseline: "Drive alone", reported: "Transit", ev: "N/A", accessPoint: "Allen", parking: "No", confidence: "Demonstration" },
  { participantId: "DEMO-0052", date: "2026-08-05", origin: "East Pasadena", destination: "PCC Main", baseline: "Drive alone", reported: "Drive alone", ev: "EV", accessPoint: "—", parking: "Lot 5", confidence: "Demonstration" },
  { participantId: "DEMO-0061", date: "2026-08-05", origin: "Central Glendale", destination: "PCC Main", baseline: "Drive alone", reported: "Shared route", ev: "EV", accessPoint: "Memorial Park", parking: "No", confidence: "Demonstration" },
];

const ROLES = ["Organization Administrator", "Site Administrator", "TDM Administrator", "Parking Administrator", "Sustainability Analyst", "Program Reviewer", "Reporting Analyst"];

export default function Prototype() {
  const keyboard = useKeyboard();
  const [experience, setExperience] = useState<Experience>("institution");
  const [mapOpen, setMapOpen] = useState(false);
  const [filter, setFilter] = useState<MapFilter>("all");
  const [selectedPoint, setSelectedPoint] = useState<CorridorPoint | null>(null);
  const [tileStatus, setTileStatus] = useState<TileStatus>("loading");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);

  const visiblePoints = useMemo(
    () => filter === "all" || filter === "planned" ? CORRIDOR_POINTS : CORRIDOR_POINTS.filter((point) => point.tags.includes(filter)),
    [filter],
  );

  useEffect(() => {
    if (experience !== "participant") return;
    const mapTab = rootRef.current?.querySelector<HTMLButtonElement>(".bottom-nav button:nth-child(4)");
    if (!mapTab) return;

    const previousLabel = mapTab.getAttribute("aria-label");
    mapTab.setAttribute("aria-label", "Map");

    return () => {
      if (previousLabel) mapTab.setAttribute("aria-label", previousLabel);
      else mapTab.removeAttribute("aria-label");
    };
  }, [experience]);

  useEffect(() => {
    if (!mapOpen || !mapNodeRef.current) return;

    leafletMapRef.current?.remove();
    setTileStatus("loading");

    const map = L.map(mapNodeRef.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 10,
      maxZoom: 19,
      preferCanvas: true,
    });

    let activeTileLayer: TileLayer | null = null;
    let tileLoadCompleted = false;
    let fallbackStarted = false;
    let primaryErrors = 0;

    const markReady = () => {
      tileLoadCompleted = true;
      setTileStatus("ready");
    };

    const activateFallback = () => {
      if (fallbackStarted || tileLoadCompleted) return;
      fallbackStarted = true;
      setTileStatus("fallback");

      if (activeTileLayer && map.hasLayer(activeTileLayer)) map.removeLayer(activeTileLayer);

      const fallbackLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 20,
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        updateWhenIdle: true,
        keepBuffer: 2,
      });

      let fallbackErrors = 0;
      fallbackLayer.once("load", markReady);
      fallbackLayer.on("tileerror", () => {
        fallbackErrors += 1;
        if (fallbackErrors >= 3) setTileStatus("error");
      });

      activeTileLayer = fallbackLayer;
      fallbackLayer.addTo(map);
    };

    const primaryLayer = L.tileLayer("/map-tiles/{z}/{x}/{y}", {
      maxZoom: 19,
      attribution: "Tiles &copy; Esri",
      updateWhenIdle: true,
      keepBuffer: 2,
    });

    primaryLayer.once("load", markReady);
    primaryLayer.on("tileerror", () => {
      primaryErrors += 1;
      if (primaryErrors >= 2) activateFallback();
    });

    activeTileLayer = primaryLayer;
    primaryLayer.addTo(map);

    const fallbackTimer = window.setTimeout(() => {
      if (!tileLoadCompleted) activateFallback();
    }, 5000);

    L.control.zoom({ position: "topright" }).addTo(map);

    if (filter === "all" || filter === "planned") {
      PLANNED_ROUTE_LINES.forEach((line, index) => {
        const route = L.polyline(line, {
          color: "#6555d8",
          weight: 4,
          opacity: 0.58,
          dashArray: index === 0 ? "8 8" : "5 7",
          lineCap: "round",
        }).addTo(map);
        route.bindTooltip("SIMULATED planned-route corridor · not a guaranteed route", { sticky: true, direction: "top" });
      });
    }

    if (filter === "all" || filter === "transit") {
      const aLine = L.polyline(A_LINE_STATION_SPINE, {
        color: "#2674b8",
        weight: 3,
        opacity: 0.58,
        dashArray: "4 6",
        lineCap: "round",
      }).addTo(map);
      aLine.bindTooltip("Metro A Line station linkage · schematic, not exact track geometry", { sticky: true, direction: "top" });

      const shuttle = L.polyline(PCC_SHUTTLE_LINE, {
        color: "#c9791a",
        weight: 4,
        opacity: 0.72,
        dashArray: "10 6",
        lineCap: "round",
      }).addTo(map);
      shuttle.bindTooltip("PCC shuttle connection · schematic, not live vehicle routing", { sticky: true, direction: "top" });
    }

    visiblePoints.forEach((point) => {
      const primaryTag = filter === "all" || filter === "planned" ? point.tags[0] : filter;
      const isTransfer = point.emphasis === "transfer";
      const isPressure = point.emphasis === "pressure";
      const isDemand = point.tags.includes("demand");
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: isDemand ? 15 : isTransfer ? 11 : isPressure ? 10 : 8,
        weight: isTransfer || isPressure ? 3 : 2,
        color: "#ffffff",
        fillColor: MARKER_COLORS[primaryTag],
        fillOpacity: isDemand ? 0.72 : 0.96,
        bubblingMouseEvents: false,
      }).addTo(map);

      marker.bindTooltip(point.name, { direction: "top", offset: [0, -8] });
      marker.on("click", () => setSelectedPoint(point));
    });

    const bounds = L.latLngBounds(visiblePoints.map((point) => [point.lat, point.lng] as [number, number]));
    if (filter === "all" || filter === "planned") PLANNED_ROUTE_LINES.flat().forEach((latLng) => bounds.extend(latLng));
    if (filter === "all" || filter === "transit") {
      A_LINE_STATION_SPINE.forEach((latLng) => bounds.extend(latLng));
      PCC_SHUTTLE_LINE.forEach((latLng) => bounds.extend(latLng));
    }

    if (bounds.isValid()) map.fitBounds(bounds, { padding: [26, 26], maxZoom: filter === "all" ? 13 : 14 });
    map.on("click", () => setSelectedPoint(null));

    const resizeTimer = window.setTimeout(() => map.invalidateSize(true), 120);
    const secondResizeTimer = window.setTimeout(() => map.invalidateSize(true), 450);
    leafletMapRef.current = map;

    return () => {
      window.clearTimeout(resizeTimer);
      window.clearTimeout(secondResizeTimer);
      window.clearTimeout(fallbackTimer);
      map.remove();
      if (leafletMapRef.current === map) leafletMapRef.current = null;
    };
  }, [mapOpen, visiblePoints, filter]);

  useEffect(() => {
    if (selectedPoint && !visiblePoints.some((point) => point.id === selectedPoint.id)) setSelectedPoint(null);
  }, [selectedPoint, visiblePoints]);

  function openMap(nextFilter: MapFilter = "all") {
    keyboard.hide();
    setFilter(nextFilter);
    setSelectedPoint(CORRIDOR_POINTS.find((point) => point.id === "allen-station") ?? CORRIDOR_POINTS[0]);
    setTileStatus("loading");
    setMapOpen(true);
  }

  function closeMap() {
    setMapOpen(false);
    setSelectedPoint(null);
  }

  function handleRootClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    if (experience !== "participant") return;
    const target = event.target as HTMLElement;
    const mapTab = target.closest(".bottom-nav button:nth-child(4)");
    if (!mapTab) return;

    event.preventDefault();
    event.stopPropagation();
    openMap("all");
  }

  return (
    <div ref={rootRef} className="relay-prototype-root" onClickCapture={handleRootClickCapture} data-map-open={mapOpen ? "true" : "false"} data-experience={experience}>
      {experience === "institution" ? (
        <InstitutionalConsole onOpenParticipant={() => setExperience("participant")} onOpenMap={openMap} />
      ) : (
        <>
          <PrototypePhase1 />
          <button className="console-return-button" onClick={() => { keyboard.hide(); setExperience("institution"); }}>Program Console</button>
        </>
      )}

      {mapOpen && (
        <section className="relay-map-overlay" aria-label="Interactive Relay Rider TDM map" role="region">
          <header className="relay-map-header">
            <div>
              <span className="relay-map-kicker">MOBILITY INTELLIGENCE MAP</span>
              <h2>Pasadena–Eagle Rock–Glendale</h2>
              <p>Generalized demand, simulated planned routes, Access Points, parking pressure, charging context, transit, and institutions.</p>
            </div>
            <button className="relay-map-close" onClick={closeMap} aria-label="Return from mobility map"><Cross2Icon /></button>
          </header>

          <div className="relay-map-filters" aria-label="Map layer filters">
            <LayersIcon />
            {FILTERS.map((item) => (
              <button key={item.id} className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>
            ))}
          </div>

          <div className="relay-map-frame">
            <div ref={mapNodeRef} className="relay-map-canvas" />

            {tileStatus !== "ready" && (
              <div className={`relay-map-tile-status ${tileStatus === "error" ? "error" : ""}`} aria-live="polite">
                {tileStatus === "loading" && "Loading street basemap…"}
                {tileStatus === "fallback" && "Primary basemap unavailable — switching map source…"}
                {tileStatus === "error" && "Basemap could not load. Mobility overlays remain available while the map source reconnects."}
              </div>
            )}

            <div className="relay-map-legend" aria-label="Map legend">
              <span><i className="demand" />Demand</span>
              <span><i className="planned" />Planned route</span>
              <span><i className="access" />Access Point</span>
              <span><i className="parking" />Parking pressure</span>
              <span><i className="ev" />EV context</span>
              <span><i className="transit" />Transit</span>
              <span><i className="institution" />Institution</span>
            </div>

            {selectedPoint && (
              <article className="relay-map-detail">
                <div className="relay-map-detail-icon"><SewingPinIcon /></div>
                <div>
                  <small>{selectedPoint.label}</small>
                  <strong>{selectedPoint.name}</strong>
                  <p>{selectedPoint.detail}</p>
                  <span>{selectedPoint.status}</span>
                </div>
              </article>
            )}
          </div>

          <p className="relay-map-footnote">
            Demand zones are generalized and demonstration records never expose precise participant home locations. Planned-route lines and parking metrics are simulated or modeled. Transit and PCC shuttle context are not guaranteed itineraries. Candidate Access Points remain subject to administrative and site review.
          </p>
        </section>
      )}
    </div>
  );
}

function InstitutionalConsole({ onOpenParticipant, onOpenMap }: { onOpenParticipant: () => void; onOpenMap: (filter?: MapFilter) => void }) {
  const [group, setGroup] = useState<AdminGroup>("overview");
  const [view, setView] = useState<AdminView>("overview");
  const [role, setRole] = useState("TDM Administrator");
  const [selectedMatch, setSelectedMatch] = useState(MATCH_PREVIEWS[0].id);
  const [contributionStates, setContributionStates] = useState<Record<string, ContributionState>>({ "MP-1042": "Compatible", "MP-1047": "Needs Review" });
  const [reviewStates, setReviewStates] = useState<Record<string, ReviewState>>({ "MP-1042": "Pending", "MP-1047": "Pending" });
  const [selectedParking, setSelectedParking] = useState(PARKING[0].name);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [intervention, setIntervention] = useState("Green Route Credits");
  const [creditBudget, setCreditBudget] = useState(50000);
  const [creditCap, setCreditCap] = useState(150);
  const [creditBehavior, setCreditBehavior] = useState("Approved shared-route participation");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [ledgerMode, setLedgerMode] = useState("All");

  const activeGroup = NAV_GROUPS.find((item) => item.id === group) ?? NAV_GROUPS[0];
  const match = MATCH_PREVIEWS.find((item) => item.id === selectedMatch) ?? MATCH_PREVIEWS[0];
  const parking = PARKING.find((item) => item.name === selectedParking) ?? PARKING[0];
  const scenario = INTERVENTIONS[intervention];
  const filteredLedger = ledgerMode === "All" ? LEDGER : LEDGER.filter((item) => item.reported === ledgerMode);

  function chooseGroup(next: AdminGroup) {
    setGroup(next);
    setView(GROUP_DEFAULTS[next]);
  }

  function chooseView(next: AdminView) {
    setView(next);
  }

  function exportLedger() {
    const headers = ["Participant ID", "Commute Date", "Origin Zone", "Destination", "Baseline Mode", "Reported Mode", "EV/Hybrid", "Access Point", "Parking Usage", "Verification Confidence"];
    const rows = filteredLedger.map((record) => [record.participantId, record.date, record.origin, record.destination, record.baseline, record.reported, record.ev, record.accessPoint, record.parking, record.confidence]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relay-rider-demo-commute-activity-ledger.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="institution-shell">
      <div className="institution-topbar">
        <div>
          <span className="institution-kicker">COMMON PATHWAYS TECHNOLOGIES</span>
          <strong>Relay Rider · Program Console</strong>
        </div>
        <button className="participant-switch" onClick={onOpenParticipant}>Participant View</button>
      </div>

      <div className="institution-context">
        <div>
          <small>DEMONSTRATION INSTITUTION</small>
          <strong>Pasadena City College · Sample Program</strong>
          <span>Institution → Main Campus → Staff → Northeast LA Corridor</span>
        </div>
        <label>
          <small>Role</small>
          <select value={role} onChange={(event) => setRole(event.currentTarget.value)}>{ROLES.map((item) => <option key={item}>{item}</option>)}</select>
        </label>
      </div>

      <div className="institution-group-nav" aria-label="Program Console navigation groups">
        {NAV_GROUPS.map((item) => <button key={item.id} className={group === item.id ? "active" : ""} onClick={() => chooseGroup(item.id)}>{item.label}</button>)}
      </div>
      <div className="institution-page-nav" aria-label={`${activeGroup.label} pages`}>
        {activeGroup.items.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => chooseView(item.id)}>{item.label}</button>)}
      </div>

      <div className="institution-scroll">
        <section className="institution-disclaimer">
          <b>Demonstration environment.</b> Administrative metrics and records shown below are DEMO DATA, MODELED, ESTIMATED, or SIMULATED as labeled. No organization shown is represented as a Relay Rider customer or partner.
        </section>

        {view === "overview" && <OverviewView onOpenMap={() => onOpenMap("all")} onNavigate={(next) => { setGroup("intelligence"); setView(next); }} />}
        {view === "demand" && <DemandView />}
        {view === "corridors" && <CorridorView />}
        {view === "parking" && (
          <ParkingView
            parking={parking}
            selectedParking={selectedParking}
            setSelectedParking={setSelectedParking}
            scenarioOpen={scenarioOpen}
            setScenarioOpen={setScenarioOpen}
            intervention={intervention}
            setIntervention={setIntervention}
            scenario={scenario}
          />
        )}
        {view === "ev" && <EvView />}
        {view === "map" && <MapWorkspace onOpenMap={onOpenMap} />}
        {view === "exchange" && <ExchangeView match={match} onSelectMatch={(id) => { setSelectedMatch(id); setView("matches"); }} />}
        {view === "needs" && <CommuteNeedsView />}
        {view === "routes" && <PlannedRoutesView />}
        {view === "matches" && (
          <MatchPreviewsView
            match={match}
            selectedMatch={selectedMatch}
            setSelectedMatch={setSelectedMatch}
            contributionStates={contributionStates}
            setContributionStates={setContributionStates}
            reviewStates={reviewStates}
            setReviewStates={setReviewStates}
          />
        )}
        {view === "access" && <AccessPointsView onOpenMap={() => onOpenMap("access")} />}
        {view === "participants" && <ParticipantsView />}
        {view === "cohorts" && <CohortsView />}
        {view === "review" && <ReviewQueueView reviewStates={reviewStates} setReviewStates={setReviewStates} />}
        {view === "credits" && (
          <CreditsView
            budget={creditBudget}
            setBudget={setCreditBudget}
            cap={creditCap}
            setCap={setCreditCap}
            behavior={creditBehavior}
            setBehavior={setCreditBehavior}
            approvalRequired={approvalRequired}
            setApprovalRequired={setApprovalRequired}
          />
        )}
        {view === "rules" && <RulesView />}
        {view === "tdm" && <TdmReportView />}
        {view === "parking-report" && <ParkingReportView />}
        {view === "sustainability" && <SustainabilityView />}
        {view === "rule2202" && <Rule2202View />}
        {view === "exports" && <LedgerView mode={ledgerMode} setMode={setLedgerMode} records={filteredLedger} onExport={exportLedger} />}
        {view === "institution" && <InstitutionAdminView role={role} />}
        {view === "sites" && <SitesView />}
        {view === "users" && <UsersView />}
        {view === "permissions" && <PermissionsView />}
        {view === "data" && <DataSettingsView />}
      </div>
    </div>
  );
}

function OverviewView({ onOpenMap, onNavigate }: { onOpenMap: () => void; onNavigate: (view: AdminView) => void }) {
  return (
    <>
      <section className="buyer-hero">
        <DemoBadge label="INSTITUTION-FUNDED TDM" />
        <h1>See the commuter problem before you fund the intervention.</h1>
        <p>Relay Rider converts commute-pattern, parking-pressure, route-interest, and EV/hybrid signals into corridor intelligence, governed commuter options, and measurable mobility programs.</p>
        <div className="buyer-actions"><button onClick={() => onNavigate("parking")}>Review parking pressure</button><button onClick={onOpenMap}>Open mobility map</button></div>
      </section>

      <section className="operating-spine" aria-label="Relay Rider operating spine">
        {"SIGNAL→RECORD→SCORE→PREVIEW→TASK→REVIEW→DASHBOARD→REPORT→PARTNER ACTION".split("→").map((item, index, array) => <span key={item}>{item}{index < array.length - 1 && <i>→</i>}</span>)}
      </section>

      <div className="admin-kpi-grid">{DEMO_KPIS.map(([label, value, qualifier]) => <KpiCard key={label} label={label} value={value} qualifier={qualifier} />)}</div>

      <SectionHeading title="Program alerts" detail="DEMO DATA" />
      <div className="admin-card-stack">{ALERTS.map(([title, place, body]) => <article className="alert-card" key={title}><span>!</span><div><small>{title}</small><strong>{place}</strong><p>{body}</p></div></article>)}</div>

      <SectionHeading title="Corridor health" detail="SIMULATED PREVIEWS" />
      <div className="corridor-table">{CORRIDORS.map((corridor) => <CorridorCard key={corridor.name} corridor={corridor} />)}</div>
    </>
  );
}

function DemandView() {
  const modes = [["Drive alone", 62], ["Carpool / shared", 11], ["Transit", 17], ["Walk / bike", 6], ["Other / mixed", 4]] as const;
  const zones = [["Central Glendale", 142], ["Eagle Rock", 96], ["East Pasadena", 88], ["North Pasadena", 61], ["Highland Park", 47]] as const;
  return (
    <>
      <PageHero eyebrow="MOBILITY INTELLIGENCE · DEMO DATA" title="Commute Demand Overview" body="Approximate zones and schedule signals reveal where an institution has concentrated commuter demand, unmatched needs, parking exposure, and potential planned-route overlap." />
      <div className="admin-kpi-grid compact"><KpiCard label="Employees surveyed" value="624" qualifier="DEMO DATA" /><KpiCard label="Commute profiles" value="568" qualifier="DEMO DATA" /><KpiCard label="Peak arrival" value="7:30–9:00" qualifier="MODELED" /><KpiCard label="Unmatched demand" value="143" qualifier="SIMULATED" /></div>
      <SectionHeading title="Origin zone demand" detail="APPROXIMATE ZONES" />
      <div className="chart-card">{zones.map(([name, value]) => <MetricBar key={name} label={name} value={value} max={150} suffix=" profiles" />)}</div>
      <SectionHeading title="Commute mode distribution" detail="DEMO DATA" />
      <div className="chart-card">{modes.map(([name, value]) => <MetricBar key={name} label={name} value={value} max={100} suffix="%" />)}</div>
      <SectionHeading title="Schedule & flexibility" detail="MODELED" />
      <div className="insight-grid"><Insight label="Arrival concentration" value="46%" detail="7:30–9:00 AM" /><Insight label="±15 min flexibility" value="39%" detail="of demo profiles" /><Insight label="Access Point willingness" value="61%" detail="of demo profiles" /><Insight label="Potential route overlap" value="129" detail="simulated previews" /></div>
    </>
  );
}

function CorridorView() {
  return (
    <>
      <PageHero eyebrow="MOBILITY INTELLIGENCE · MODELED" title="Corridor Opportunity Detection" body="Relay Rider looks for concentrated demand, registered planned-route supply, schedule compatibility, Access Point fit, and parking pressure before surfacing commuter-option previews." />
      <div className="corridor-table">{CORRIDORS.map((corridor) => <CorridorCard key={corridor.name} corridor={corridor} expanded />)}</div>
      <section className="admin-note"><strong>Unmatched commuter demand</strong><p>DEMO DATA: Eagle Rock → Pasadena has 96 commute profiles but only 18 registered planned routes, creating the clearest demonstration supply gap.</p></section>
    </>
  );
}

function ParkingView({ parking, selectedParking, setSelectedParking, scenarioOpen, setScenarioOpen, intervention, setIntervention, scenario }: {
  parking: typeof PARKING[number]; selectedParking: string; setSelectedParking: (value: string) => void; scenarioOpen: boolean; setScenarioOpen: (value: boolean) => void; intervention: string; setIntervention: (value: string) => void; scenario: typeof INTERVENTIONS[string];
}) {
  return (
    <>
      <PageHero eyebrow="PARKING INTELLIGENCE · MODELED" title="Parking pressure is a TDM signal." body="Connect arrival pressure, drive-alone share, route opportunity, EV participation, and Access Point strategy to the parking facilities an institution is trying to manage." />
      <div className="parking-selector">{PARKING.map((item) => <button key={item.name} className={selectedParking === item.name ? "active" : ""} onClick={() => setSelectedParking(item.name)}>{item.name}<small>{item.pressure}</small></button>)}</div>
      <section className="parking-focus-card">
        <div className="parking-pressure-heading"><div><small>DEMO DATA</small><h2>{parking.name}</h2></div><PressureChip value={parking.pressure} /></div>
        <div className="parking-metrics"><Insight label="Peak occupancy" value={`${parking.occupancy}%`} detail={parking.peak} /><Insight label="Drive-alone represented" value={String(parking.solo)} detail="demo commuters" /><Insight label="Compatible planned routes" value={String(parking.routes)} detail="simulated" /><Insight label="Shared candidates" value={String(parking.candidates)} detail="modeled" /><Insight label="EV / hybrid" value={`${parking.ev}%`} detail="demo participation" /><Insight label="Access Points" value={String(parking.access)} detail="candidates" /></div>
        <button className="admin-primary" onClick={() => setScenarioOpen(!scenarioOpen)}>{scenarioOpen ? "Close scenario builder" : "Model TDM Intervention"}</button>
      </section>
      {scenarioOpen && (
        <section className="scenario-builder">
          <DemoBadge label="SCENARIO-BASED" />
          <h2>Intervention Scenario Builder</h2>
          <p>Choose one demonstration intervention. Outputs are modeled estimates and are not promised outcomes.</p>
          <div className="choice-grid">{Object.keys(INTERVENTIONS).map((item) => <button key={item} className={intervention === item ? "active" : ""} onClick={() => setIntervention(item)}>{item}</button>)}</div>
          <div className="admin-kpi-grid compact"><KpiCard label="Participants affected" value={String(scenario.participants)} qualifier="ESTIMATED" /><KpiCard label="Parking spaces affected" value={String(scenario.spaces)} qualifier="MODELED" /><KpiCard label="Program cost" value={scenario.cost} qualifier="SCENARIO" /><KpiCard label="Possible route matches" value={String(scenario.matches)} qualifier="SIMULATED" /><KpiCard label="Drive-alone change" value={scenario.sov} qualifier="MODELED" /></div>
        </section>
      )}
    </>
  );
}

function EvView() {
  return (
    <>
      <PageHero eyebrow="EV / HYBRID CORRIDOR ANALYSIS · DEMO DATA" title="See clean-vehicle participation in corridor context." body="Relay Rider tracks EV/hybrid participation, charging-demand signals, corridor concentration, and employer-sponsored incentive scenarios without treating them as certified carbon credits or guaranteed savings." />
      <div className="admin-kpi-grid compact"><KpiCard label="EV / hybrid participation" value="28%" qualifier="DEMO DATA" /><KpiCard label="High-EV corridor" value="Glendale" qualifier="DEMO DATA" /><KpiCard label="Charging demand signal" value="High" qualifier="MODELED" /><KpiCard label="Clean-route previews" value="41" qualifier="SIMULATED" /></div>
      <SectionHeading title="Corridor EV participation" detail="DEMO DATA" />
      <div className="chart-card"><MetricBar label="Glendale → Pasadena" value={31} max={40} suffix="%" /><MetricBar label="Eagle Rock → Pasadena" value={24} max={40} suffix="%" /><MetricBar label="East Pasadena → PCC" value={34} max={40} suffix="%" /></div>
      <section className="admin-note"><strong>Charging-demand signal</strong><p>MODELED: morning parking pressure plus EV/hybrid participation suggests a need to evaluate charging utilization and arrival-window demand. This is planning intelligence, not a direct charging reservation or reimbursement service.</p></section>
    </>
  );
}

function MapWorkspace({ onOpenMap }: { onOpenMap: (filter?: MapFilter) => void }) {
  return (
    <>
      <PageHero eyebrow="REAL INTERACTIVE MAP" title="Layer institutional mobility signals without exposing homes." body="The working Leaflet map preserves public/institutional anchors while adding generalized demand zones, simulated planned routes, parking-pressure context, EV context, transit, and Access Point layers." />
      <div className="map-layer-launcher">{FILTERS.filter((item) => item.id !== "all").map((item) => <button key={item.id} onClick={() => onOpenMap(item.id)}><LayersIcon /><span>{item.label}</span><small>Open layer</small></button>)}</div>
      <button className="admin-primary" onClick={() => onOpenMap("all")}>Open all mobility layers</button>
    </>
  );
}

function ExchangeView({ match, onSelectMatch }: { match: MatchPreview; onSelectMatch: (id: string) => void }) {
  return (
    <>
      <PageHero eyebrow="CORRIDOR EXCHANGE · SIMULATED" title="Compare governed commuter options with the baseline." body="Relay Rider prioritizes compatible planned-route options when appropriate while still showing transit and multimodal context. Nothing here is a guaranteed ride or transportation purchase." />
      <div className="comparison-stack">
        <ComparisonCard title="Relay commuter option" primary={`${match.compatibility}% compatibility`} detail={`${match.detour} · ${match.accessPoint}`} status="Administrative review required" emphasis onClick={() => onSelectMatch(match.id)} />
        <ComparisonCard title="Transit option" primary="Metro A Line + PCC shuttle context" detail="Estimated transfer context · walking connection modeled" status="Transit context" />
        <ComparisonCard title="Bike + transit" primary="Approx. bike connection + A Line" detail="Scenario comparison only" status="MODELED" />
        <ComparisonCard title="Drive-alone baseline" primary="Parking pressure: HIGH" detail="Baseline mode · parking demand represented" status="DEMO DATA" />
      </div>
      <section className="prototype-language-card"><strong>Prototype disclaimer</strong><p>This is a simulated commuter option in a product prototype. A proposed contribution is not a confirmed fare or transportation purchase. Options do not guarantee acceptance or route operation and may require administrative review.</p></section>
    </>
  );
}

function CommuteNeedsView() {
  const rows = [
    ["NEED-221", "Eagle Rock", "PCC Main", "Tue / Thu", "8:00–8:30", "Often difficult", "Access Point OK"],
    ["NEED-227", "Central Glendale", "PCC Main", "Mon–Fri", "7:30–8:00", "Often difficult", "Allen OK"],
    ["NEED-232", "East Pasadena", "PCC Main", "Mon / Wed", "9:00–9:30", "Sometimes", "Transit OK"],
  ];
  return <DemoTablePage eyebrow="CORRIDOR EXCHANGE · DEMO DATA" title="Commute Needs" body="Demonstration commuter-need records use generalized zones and schedule windows rather than exact homes." columns={["ID", "Origin", "Destination", "Days", "Arrival", "Parking", "Preference"]} rows={rows} />;
}

function PlannedRoutesView() {
  const rows = [
    ["ROUTE-074", "Glendale", "PCC Main", "Mon–Fri", "2 seats", "8 min", "EV"],
    ["ROUTE-081", "Eagle Rock", "PCC Main", "Tue / Thu", "1 seat", "10 min", "Hybrid"],
    ["ROUTE-086", "Pasadena", "Foothill", "Mon / Wed", "2 seats", "5 min", "ICE / no preference"],
  ];
  return <DemoTablePage eyebrow="CORRIDOR EXCHANGE · DEMO DATA" title="Registered Planned Routes" body="These sample routes represent trips participants already intend to make. Relay Rider does not dispatch drivers or assign nearest vehicles." columns={["ID", "Origin", "Destination", "Days", "Capacity", "Max detour", "Vehicle"]} rows={rows} />;
}

function MatchPreviewsView({ match, selectedMatch, setSelectedMatch, contributionStates, setContributionStates, reviewStates, setReviewStates }: {
  match: MatchPreview; selectedMatch: string; setSelectedMatch: (id: string) => void; contributionStates: Record<string, ContributionState>; setContributionStates: (value: Record<string, ContributionState>) => void; reviewStates: Record<string, ReviewState>; setReviewStates: (value: Record<string, ReviewState>) => void;
}) {
  const contributionState = contributionStates[match.id] ?? "Draft";
  const reviewState = reviewStates[match.id] ?? "Pending";
  return (
    <>
      <PageHero eyebrow="MATCH PREVIEW ENGINE · SIMULATED" title="Every option must explain why it appeared." body="Compatibility is a multi-factor preview, not a promise of transportation. Route-fit, schedule, detour, Access Point, contribution, eligibility, accessibility, and administrative status stay visible." />
      <div className="match-picker">{MATCH_PREVIEWS.map((item) => <button key={item.id} className={selectedMatch === item.id ? "active" : ""} onClick={() => setSelectedMatch(item.id)}><small>{item.id}</small><strong>{item.corridor}</strong><span>{item.compatibility}% preview</span></button>)}</div>
      <section className="match-explanation-card">
        <div className="match-score-head"><div><DemoBadge label="SIMULATED COMMUTER OPTION" /><h2>{match.corridor}</h2></div><b>{match.compatibility}%</b></div>
        <div className="match-factor-grid">
          <Factor label="Compatibility Score" value={`${match.compatibility}%`} />
          <Factor label="Route-Fit Score" value={`${match.routeFit}%`} />
          <Factor label="Schedule Fit" value={match.scheduleFit} />
          <Factor label="Estimated Detour" value={match.detour} />
          <Factor label="Route Overlap" value={match.overlap} />
          <Factor label="Access Point" value={match.accessPoint} />
          <Factor label="Contribution" value={match.contribution} />
          <Factor label="EV / Hybrid" value={match.ev} />
          <Factor label="Institution / Cohort" value={match.eligibility} />
          <Factor label="Accessibility" value={match.accessibility} />
          <Factor label="Admin Review" value={reviewState === "Pending" ? match.review : reviewState} />
        </div>
        <h3>WHY THIS OPTION APPEARED</h3>
        <ul>{match.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        <div className="privacy-box"><strong>Privacy</strong><span>Approximate origin only ✓</span><span>Exact address hidden ✓</span><span>Access Point selected ✓</span><span>Contact information protected ✓</span><span>Institution membership shown as demo eligibility only ✓</span></div>
      </section>
      <section className="contribution-review-card">
        <small>PROPOSED CONTRIBUTION · PARTICIPATION SIGNAL</small>
        <h2>{contributionState}</h2>
        <p>Your proposed contribution represents your willingness to contribute toward a compatible planned-route option. It is not a confirmed fare or transportation purchase. Options remain subject to participant acceptance, program rules, and administrative review.</p>
        <div className="buyer-actions"><button onClick={() => setContributionStates({ ...contributionStates, [match.id]: "Submitted" })}>Express route interest</button><button onClick={() => { setContributionStates({ ...contributionStates, [match.id]: "Accepted for Review" }); setReviewStates({ ...reviewStates, [match.id]: "Accepted for Review" }); }}>Request administrative review</button></div>
      </section>
    </>
  );
}

function AccessPointsView({ onOpenMap }: { onOpenMap: () => void }) {
  return (
    <>
      <PageHero eyebrow="ACCESS POINT SYSTEM · DEMO PROGRAM" title="Use reviewed public coordination locations before precise private locations." body="Access Points can be candidates, reviewed, designated, or institutionally approved. Relay Rider does not guarantee safety." />
      <div className="admin-card-stack">{ACCESS_POINTS.map((point) => <article className="access-point-card" key={point.name}><div><small>{point.type}</small><h2>{point.name}</h2><StatusChip value={point.approval} /></div><dl><div><dt>Corridors served</dt><dd>{point.corridors}</dd></div><div><dt>Transit</dt><dd>{point.transit}</dd></div><div><dt>EV charging nearby</dt><dd>{point.ev}</dd></div><div><dt>Lighting review</dt><dd>{point.lighting}</dd></div><div><dt>Visibility review</dt><dd>{point.visibility}</dd></div><div><dt>Accessibility review</dt><dd>{point.accessibility}</dd></div></dl></article>)}</div>
      <button className="admin-primary" onClick={onOpenMap}>Review Access Points on map</button>
    </>
  );
}

function ParticipantsView() {
  return (
    <>
      <PageHero eyebrow="PROGRAM CONSOLE · DEMO DATA" title="Institution → Site → Cohort → Corridor → Participant" body="The institutional hierarchy keeps commuter records, program eligibility, incentives, and reporting scoped to the correct organization and participant group." />
      <section className="hierarchy-card"><span>Pasadena City College</span><i>→</i><span>Main Campus</span><i>→</i><span>Staff</span><i>→</i><span>Northeast Los Angeles Corridor</span><i>→</i><strong>186 commute profiles</strong></section>
      <div className="admin-kpi-grid compact"><KpiCard label="Commute profiles" value="186" qualifier="DEMO DATA" /><KpiCard label="Planned routes" value="34" qualifier="DEMO DATA" /><KpiCard label="Compatibility previews" value="71" qualifier="SIMULATED" /><KpiCard label="Access Point opportunities" value="24" qualifier="SIMULATED" /></div>
      <section className="message-preview-card"><strong>Messaging preview — demonstration environment.</strong><p>Program Announcement · Option Discussion · Administrative Message · Access Point Instructions. Personal phone numbers and email addresses are not exposed between participants.</p></section>
    </>
  );
}

function CohortsView() {
  const cohorts = [["Staff", 186, "Main Campus"], ["Students", 251, "Main + Foothill"], ["Evening workforce", 64, "Main Campus"], ["EV / hybrid interest", 93, "Multi-site"]] as const;
  return (
    <>
      <PageHero eyebrow="PROGRAM CONSOLE · DEMO DATA" title="Cohorts & participant groups" body="Institutions can scope commuter programs, matching eligibility, incentives, and reporting to approved groups instead of operating an unrestricted public marketplace." />
      <div className="admin-card-stack">{cohorts.map(([name, count, site]) => <article className="cohort-card" key={name}><div><small>Sample cohort</small><strong>{name}</strong><span>{site}</span></div><b>{count}</b></article>)}</div>
    </>
  );
}

function ReviewQueueView({ reviewStates, setReviewStates }: { reviewStates: Record<string, ReviewState>; setReviewStates: (value: Record<string, ReviewState>) => void }) {
  return (
    <>
      <PageHero eyebrow="PROGRAM REVIEW · SIMULATED" title="Administrative review before participant connection." body="A reviewer can inspect compatibility evidence and change the demonstration review state. These buttons do not activate transportation or contact participants." />
      <div className="admin-card-stack">{MATCH_PREVIEWS.map((item) => {
        const state = reviewStates[item.id] ?? "Pending";
        return <article className="review-card" key={item.id}><div><small>{item.id} · {state}</small><strong>{item.corridor}</strong><p>{item.compatibility}% compatibility · {item.detour} · {item.accessPoint}</p></div><div className="review-actions"><button onClick={() => setReviewStates({ ...reviewStates, [item.id]: "Accepted for Review" })}>Accept for Review</button><button onClick={() => setReviewStates({ ...reviewStates, [item.id]: "Declined" })}>Decline</button></div></article>;
      })}</div>
    </>
  );
}

function CreditsView({ budget, setBudget, cap, setCap, behavior, setBehavior, approvalRequired, setApprovalRequired }: {
  budget: number; setBudget: (value: number) => void; cap: number; setCap: (value: number) => void; behavior: string; setBehavior: (value: string) => void; approvalRequired: boolean; setApprovalRequired: (value: boolean) => void;
}) {
  const allocated = Math.round(budget * 0.72);
  const approved = Math.round(budget * 0.41);
  const used = Math.round(budget * 0.27);
  const remaining = budget - allocated;
  return (
    <>
      <PageHero eyebrow="GREEN ROUTE CREDITS · SAMPLE PROGRAM" title="Configure capped employer-sponsored participation incentives." body="Green Route Credits are promotional or employer-sponsored program benefits. They are not cash wages, fares, guaranteed earnings, certified carbon offsets, LCFS credits, or direct charging reimbursements." />
      <section className="credit-builder">
        <div className="setting-row"><div><small>Program Name</small><strong>PCC Green Commute Demonstration</strong></div><StatusChip value="Sample Program" /></div>
        <SettingChoices label="Total Budget" options={[25000, 50000, 75000, 100000]} value={budget} render={(value) => `$${value / 1000}k`} onChange={setBudget} />
        <SettingChoices label="Participant Cap" options={[75, 100, 150, 250]} value={cap} render={(value) => String(value)} onChange={setCap} />
        <SettingChoices label="Eligible Behavior" options={["Verified commute profile", "Qualified planned-route registration", "Approved shared-route participation", "Transit participation", "Access Point participation", "EV/hybrid corridor participation"]} value={behavior} render={(value) => value} onChange={setBehavior} />
        <button className={`approval-toggle ${approvalRequired ? "active" : ""}`} onClick={() => setApprovalRequired(!approvalRequired)}><span>Approval requirement</span><b>{approvalRequired ? "Required" : "Not required"}</b></button>
      </section>
      <div className="admin-kpi-grid compact"><KpiCard label="Program Budget" value={`$${budget.toLocaleString()}`} qualifier="CONFIGURED" /><KpiCard label="Allocated" value={`$${allocated.toLocaleString()}`} qualifier="DEMO DATA" /><KpiCard label="Approved" value={`$${approved.toLocaleString()}`} qualifier="DEMO DATA" /><KpiCard label="Used" value={`$${used.toLocaleString()}`} qualifier="DEMO DATA" /><KpiCard label="Remaining" value={`$${remaining.toLocaleString()}`} qualifier="DEMO DATA" /></div>
      <section className="prototype-language-card"><strong>Prototype statuses</strong><p>Pending · Eligible · Approved · Redeemed · Expired · Denied. No real payment processing is connected.</p></section>
    </>
  );
}

function RulesView() {
  const rules = ["Institution-only matching", "Cohort eligibility required", "Access Point required for participant connection", "Administrative review required", "Approximate zone before precise location", "Contact details remain masked"];
  return (
    <>
      <PageHero eyebrow="PROGRAM RULES · DEMONSTRATION" title="Govern the commuter marketplace instead of opening it to the public." body="Program rules determine who can participate, what can be previewed, and which options require administrative review." />
      <div className="rules-list">{rules.map((rule) => <div key={rule}><span>✓</span><strong>{rule}</strong><small>Enabled in demonstration policy</small></div>)}</div>
      <section className="privacy-settings-card"><h2>Participant privacy defaults</h2><p>Approximate zone only · Hide exact destination until approved · Institution-only matching · Cohort-only matching · Access Point required · Do not display profile photo.</p></section>
    </>
  );
}

function TdmReportView() {
  return (
    <>
      <PageHero eyebrow="REPORTING CENTER · MODELED / DEMO DATA" title="Turn commuter activity into institutional TDM metrics." body="Reporting summarizes participation and modeled outcomes without claiming regulatory compliance, certified emissions reductions, or guaranteed parking impacts." />
      <div className="admin-kpi-grid compact"><KpiCard label="Drive-alone share" value="62%" qualifier="DEMO DATA" /><KpiCard label="Alternative commute" value="38%" qualifier="DEMO DATA" /><KpiCard label="Match-preview conversion" value="18%" qualifier="SIMULATED" /><KpiCard label="Avg. estimated detour" value="5.4 min" qualifier="MODELED" /><KpiCard label="Estimated VMT affected" value="1,840" qualifier="MODELED" /><KpiCard label="Cost / participant" value="$32" qualifier="SCENARIO" /></div>
      <ReportMenu />
    </>
  );
}

function ParkingReportView() {
  return (
    <>
      <PageHero eyebrow="PARKING REPORT · MODELED" title="Connect commute behavior to parking exposure." body="This demonstration report compares facility pressure, drive-alone share, route opportunity, EV parking utilization, and modeled TDM intervention effects." />
      <div className="corridor-table">{PARKING.map((item) => <article className="report-parking-row" key={item.name}><div><strong>{item.name}</strong><small>{item.peak}</small></div><PressureChip value={item.pressure} /><span>{item.occupancy}% peak</span><span>{item.candidates} shared candidates</span></article>)}</div>
    </>
  );
}

function SustainabilityView() {
  return (
    <>
      <PageHero eyebrow="SUSTAINABILITY SUMMARY · ESTIMATED" title="Track clean-mobility participation without overstating environmental claims." body="Relay Rider can report EV/hybrid participation, alternative commute activity, Access Point use, and estimated VMT affected. These are not certified carbon offsets or guaranteed emissions reductions." />
      <div className="admin-kpi-grid compact"><KpiCard label="EV / hybrid participation" value="28%" qualifier="DEMO DATA" /><KpiCard label="Transit participation" value="17%" qualifier="DEMO DATA" /><KpiCard label="Shared-route activity" value="11%" qualifier="DEMO DATA" /><KpiCard label="Estimated VMT affected" value="1,840" qualifier="MODELED" /></div>
    </>
  );
}

function Rule2202View() {
  const readiness = [["Employee / participant baseline", "Available in demo schema"], ["Commute mode distribution", "Available"], ["Worksite / site scoping", "Available"], ["Commute activity ledger", "Prototype available"], ["Regulatory calculation validation", "Not validated"], ["AQMD filing integration", "Not implemented"]] as const;
  return (
    <>
      <PageHero eyebrow="AQMD / RULE 2202 READINESS" title="Reporting readiness, not regulatory filing." body="The prototype can organize commute activity and TDM metrics that may support a future Rule 2202 workflow. It does not create or submit a validated AQMD filing." />
      <div className="readiness-list">{readiness.map(([label, value]) => <div key={label}><strong>{label}</strong><span>{value}</span></div>)}</div>
      <section className="admin-note warning"><strong>Validation required</strong><p>Regulatory formulas, required fields, reporting periods, ETC workflows, and submission requirements must be validated against current South Coast AQMD guidance before compliance use.</p></section>
    </>
  );
}

function LedgerView({ mode, setMode, records, onExport }: { mode: string; setMode: (value: string) => void; records: LedgerRecord[]; onExport: () => void }) {
  const modes = ["All", "Carpool", "Transit", "Drive alone", "Shared route"];
  return (
    <>
      <PageHero eyebrow="COMMUTE ACTIVITY LEDGER · DEMO DATA" title="Auditable program activity, separated from operational transportation." body="The ledger is the administrative record concept beneath participation, parking, incentives, and reporting. These rows are demonstration records only." />
      <div className="ledger-filter">{modes.map((item) => <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item}</button>)}</div>
      <div className="ledger-table">{records.map((record) => <article key={`${record.participantId}-${record.date}`}><div><small>{record.participantId} · {record.date}</small><strong>{record.origin} → {record.destination}</strong></div><span><b>Baseline</b>{record.baseline}</span><span><b>Reported</b>{record.reported}</span><span><b>EV / Hybrid</b>{record.ev}</span><span><b>Access Point</b>{record.accessPoint}</span><span><b>Parking</b>{record.parking}</span><span><b>Verification</b>{record.confidence}</span></article>)}</div>
      <button className="admin-primary" onClick={onExport}>Export Demo CSV</button>
      <p className="admin-footnote">The export is a functioning prototype CSV generated from the displayed DEMO DATA. It is not a regulatory filing.</p>
    </>
  );
}

function InstitutionAdminView({ role }: { role: string }) {
  return (
    <>
      <PageHero eyebrow="ADMIN · DEMONSTRATION" title="Institution configuration" body="Institution-level settings scope sites, cohorts, reviewers, parking facilities, Access Points, incentives, and reporting permissions." />
      <div className="admin-detail-list"><SettingDetail label="Institution" value="Pasadena City College · Demonstration Institution" /><SettingDetail label="Program" value="Sample Employer Mobility Program" /><SettingDetail label="Current role" value={role} /><SettingDetail label="Data retention · research beta" value="90 days from initial submission" /></div>
    </>
  );
}

function SitesView() {
  return <DemoTablePage eyebrow="ADMIN · DEMONSTRATION" title="Sites" body="Sites keep parking, cohorts, Access Points, and reports separated by physical or organizational location." columns={["Site", "Profiles", "Parking", "Access Points"]} rows={[["Main Campus", "412", "High", "5"], ["Foothill Campus", "104", "Moderate", "2"], ["Jefferson Training Center", "52", "Not modeled", "Pending"]]} />;
}

function UsersView() {
  return <DemoTablePage eyebrow="ADMIN · DEMONSTRATION" title="Administrative users" body="Enterprise authentication is not implemented in this prototype; role switching demonstrates the intended permission model." columns={["Demo user", "Role", "Scope"]} rows={[["Admin A", "Organization Administrator", "Institution"], ["Reviewer B", "Program Reviewer", "Main Campus"], ["Analyst C", "Reporting Analyst", "All sites"]]} />;
}

function PermissionsView() {
  return (
    <>
      <PageHero eyebrow="ADMIN · PERMISSIONS MODEL" title="Role-based permissions" body="The prototype demonstrates intended roles. Production enforcement should use authenticated organization membership and server-side authorization." />
      <div className="rules-list">{ROLES.map((role) => <div key={role}><span>•</span><strong>{role}</strong><small>Demonstration role · production permissions not yet enforced in this UI</small></div>)}</div>
    </>
  );
}

function DataSettingsView() {
  return (
    <>
      <PageHero eyebrow="ADMIN · DATA SETTINGS" title="Privacy, retention, and research-data boundaries" body="Relay Rider should collect only necessary information, use approximate zones before precise locations, separate participant/admin views, and maintain deletion policies." />
      <div className="admin-detail-list"><SettingDetail label="Research-beta retention" value="90 days from initial submission" /><SettingDetail label="Exact home addresses" value="Not collected in research-beta intake" /><SettingDetail label="Participant contact" value="Masked / not connected" /><SettingDetail label="Canonical participant network" value="Authenticated Supabase schema · separate from anonymous staging" /><SettingDetail label="Demo datasets" value="Administrative demonstration only" /></div>
    </>
  );
}

function ReportMenu() {
  const items = ["Executive Summary", "TDM Program Report", "Corridor Performance", "Parking Report", "EV / Hybrid Report", "Incentive Effectiveness", "Access Point Report", "Participation Report", "Mode Shift Report", "Sustainability Summary", "Rule 2202 Reporting Readiness"];
  return <div className="report-menu">{items.map((item) => <div key={item}><strong>{item}</strong><span>Prototype view</span></div>)}</div>;
}

function DemoTablePage({ eyebrow, title, body, columns, rows }: { eyebrow: string; title: string; body: string; columns: string[]; rows: string[][] }) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} body={body} />
      <div className="demo-table"><div className="demo-table-head">{columns.map((column) => <span key={column}>{column}</span>)}</div>{rows.map((row, rowIndex) => <div className="demo-table-row" key={`${row[0]}-${rowIndex}`}>{row.map((cell, cellIndex) => <span key={`${cellIndex}-${cell}`}><small>{columns[cellIndex]}</small>{cell}</span>)}</div>)}</div>
    </>
  );
}

function ComparisonCard({ title, primary, detail, status, emphasis = false, onClick }: { title: string; primary: string; detail: string; status: string; emphasis?: boolean; onClick?: () => void }) {
  return <button className={`comparison-card ${emphasis ? "emphasis" : ""}`} onClick={onClick}><small>{title}</small><strong>{primary}</strong><p>{detail}</p><span>{status}</span></button>;
}

function PageHero({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return <section className="admin-page-hero"><small>{eyebrow}</small><h1>{title}</h1><p>{body}</p></section>;
}

function SectionHeading({ title, detail }: { title: string; detail: string }) {
  return <div className="admin-section-heading"><h2>{title}</h2><span>{detail}</span></div>;
}

function DemoBadge({ label }: { label: string }) {
  return <span className="demo-badge">{label}</span>;
}

function KpiCard({ label, value, qualifier }: { label: string; value: string; qualifier: string }) {
  return <article className="admin-kpi"><small>{qualifier}</small><strong>{value}</strong><span>{label}</span></article>;
}

function Insight({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="insight-card"><small>{label}</small><strong>{value}</strong><span>{detail}</span></article>;
}

function MetricBar({ label, value, max, suffix }: { label: string; value: number; max: number; suffix: string }) {
  const width = Math.max(4, Math.min(100, (value / max) * 100));
  return <div className="metric-bar"><div><strong>{label}</strong><span>{value}{suffix}</span></div><i><b style={{ width: `${width}%` }} /></i></div>;
}

function CorridorCard({ corridor, expanded = false }: { corridor: typeof CORRIDORS[number]; expanded?: boolean }) {
  return <article className="corridor-health-card"><div className="corridor-health-head"><div><small>{corridor.status}</small><strong>{corridor.name}</strong></div><StatusChip value={corridor.parking} /></div><div className="corridor-health-metrics"><span><b>{corridor.demand}</b>Demand</span><span><b>{corridor.supply}</b>Planned routes</span><span><b>{corridor.previews}</b>Previews</span>{expanded && <><span><b>{corridor.detour}</b>Avg detour</span><span><b>{corridor.access}</b>Access fit</span><span><b>{corridor.ev}</b>EV / hybrid</span></>}</div></article>;
}

function Factor({ label, value }: { label: string; value: string }) {
  return <div className="match-factor"><small>{label}</small><strong>{value}</strong></div>;
}

function PressureChip({ value }: { value: string }) {
  return <span className={`pressure-chip ${value.toLowerCase()}`}>{value}</span>;
}

function StatusChip({ value }: { value: string }) {
  return <span className="admin-status-chip">{value}</span>;
}

function SettingDetail({ label, value }: { label: string; value: string }) {
  return <div><small>{label}</small><strong>{value}</strong></div>;
}

function SettingChoices<T extends string | number>({ label, options, value, render, onChange }: { label: string; options: readonly T[]; value: T; render: (value: T) => ReactNode; onChange: (value: T) => void }) {
  return <div className="setting-choices"><small>{label}</small><div>{options.map((option) => <button key={String(option)} className={value === option ? "active" : ""} onClick={() => onChange(option)}>{render(option)}</button>)}</div></div>;
}
