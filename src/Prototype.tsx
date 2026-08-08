import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import L, { type Map as LeafletMap, type TileLayer } from "leaflet";
import { Cross2Icon, LayersIcon, SewingPinIcon } from "@radix-ui/react-icons";
import { useKeyboard } from "./mobile";
import InstitutionalWorkspace from "./InstitutionalWorkspace";
import PrototypePhase1 from "./PrototypePhase1";
import "leaflet/dist/leaflet.css";
import "./prototype.css";

type Experience = "institution" | "participant";
type MapTag = "demand" | "planned" | "access" | "transit" | "shuttle" | "parking" | "ev" | "institution";
type MapFilter = "all" | MapTag;
type TileStatus = "loading" | "ready" | "fallback" | "error";

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

const CORRIDOR_POINTS: CorridorPoint[] = [
  {
    id: "glendale-demand-zone",
    name: "Central Glendale demand zone",
    lat: 34.1469,
    lng: -118.2551,
    tags: ["demand"],
    label: "Generalized origin demand zone",
    status: "DEMONSTRATION DATA · approximate zone only",
    detail: "Aggregated modeled commuter demand. This point does not represent an individual participant home location.",
  },
  {
    id: "eagle-rock-demand-zone",
    name: "Eagle Rock demand zone",
    lat: 34.1396,
    lng: -118.2078,
    tags: ["demand"],
    label: "Generalized origin demand zone",
    status: "DEMONSTRATION DATA · approximate zone only",
    detail: "Generalized demand used to illustrate corridor opportunity detection and parking-pressure analysis.",
  },
  {
    id: "highland-park-demand-zone",
    name: "Highland Park demand zone",
    lat: 34.1117,
    lng: -118.1914,
    tags: ["demand"],
    label: "Generalized origin demand zone",
    status: "DEMONSTRATION DATA · approximate zone only",
    detail: "Aggregated demonstration demand for a Pasadena/PCC-oriented commuter corridor.",
  },
  {
    id: "altadena-demand-zone",
    name: "Altadena demand zone",
    lat: 34.1897,
    lng: -118.1311,
    tags: ["demand"],
    label: "Generalized origin demand zone",
    status: "DEMONSTRATION DATA · approximate zone only",
    detail: "Aggregated modeled demand. Exact participant locations are not displayed to administrators.",
  },
  {
    id: "glendale-transit-center",
    name: "Glendale Transportation Center",
    lat: 34.1236,
    lng: -118.2587,
    tags: ["access", "transit"],
    label: "Regional transit + Access Point candidate",
    status: "Candidate · administrative review required",
    detail: "Regional mobility anchor near the west end of the Pasadena–Eagle Rock–Glendale demonstration corridor.",
  },
  {
    id: "eagle-rock-plaza",
    name: "Eagle Rock Plaza public edge",
    lat: 34.1399,
    lng: -118.2248,
    tags: ["access", "transit"],
    label: "Access Point candidate",
    status: "Candidate · site suitability review required",
    detail: "Public-facing corridor anchor used to study low-detour Access Point compatibility. No property permission or safety guarantee is implied.",
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
    detail: "Central Pasadena A Line station for scheduled/static rail-linked commute previews.",
  },
  {
    id: "lake-station",
    name: "Lake Station",
    lat: 34.15181,
    lng: -118.13212,
    tags: ["transit"],
    label: "Metro A Line station",
    status: "Transit anchor · scheduled/static context",
    detail: "Pasadena A Line station shown as nearby rail context for institution-focused commute planning.",
  },
  {
    id: "allen-station",
    name: "Allen Station · PCC Shuttle Connection",
    lat: 34.15244,
    lng: -118.11356,
    tags: ["transit", "shuttle", "access"],
    label: "PCC Shuttle + Metro A Line transfer hub",
    status: "Published mobility context · program eligibility applies",
    detail: "PCC identifies curbside boarding in front of Allen Station at the PCC Shuttle Stop sign. This is used as a transfer-hub example, not a guaranteed itinerary.",
    emphasis: "transfer",
  },
  {
    id: "sierra-madre-villa",
    name: "Sierra Madre Villa Station",
    lat: 34.14846,
    lng: -118.08149,
    tags: ["transit"],
    label: "Metro A Line station",
    status: "Transit anchor · scheduled/static context",
    detail: "East Pasadena A Line station included for multimodal access and corridor-demand context.",
  },
  {
    id: "pcc-colorado-shuttle",
    name: "PCC Colorado Campus · Lots 6 & 7",
    lat: 34.14515,
    lng: -118.11695,
    tags: ["shuttle", "institution", "access"],
    label: "PCC shuttle boarding-area context",
    status: "Published boarding area · approximate map pin",
    detail: "The pin represents the published campus/parking-area context rather than a surveyed curb coordinate or Relay Rider-approved pickup location.",
  },
  {
    id: "pcc-foothill-shuttle",
    name: "PCC Foothill Campus · Lot C",
    lat: 34.15072,
    lng: -118.08644,
    tags: ["shuttle", "institution", "access"],
    label: "PCC shuttle boarding-area context",
    status: "Published boarding area · approximate campus pin",
    detail: "The prototype pin represents the campus/lot area and should not be interpreted as a Relay Rider-approved Access Point.",
  },
  {
    id: "pcc-jefferson",
    name: "PCC Jefferson Training Center",
    lat: 34.15492,
    lng: -118.11881,
    tags: ["institution", "shuttle"],
    label: "PCC-affiliated shuttle-network site",
    status: "Precise boarding location pending confirmation",
    detail: "The site is included as public mobility context; no exact Relay Rider boarding location is asserted.",
  },
  {
    id: "pcc-parking-pressure",
    name: "PCC parking pressure context",
    lat: 34.1443,
    lng: -118.1174,
    tags: ["parking", "institution"],
    label: "Modeled parking-pressure point",
    status: "MODELED EXAMPLE · 94% peak utilization scenario",
    detail: "A demonstration facility-level pressure signal used to connect corridor demand with parking interventions.",
    emphasis: "pressure",
  },
  {
    id: "pcc-charging-context",
    name: "PCC institutional charging context",
    lat: 34.1447,
    lng: -118.1157,
    tags: ["ev", "institution"],
    label: "EV / charging context",
    status: "Institutional context · public access not assumed",
    detail: "Used to demonstrate charging-demand and clean-vehicle analysis. Public availability, pricing, and real-time utilization are not represented.",
  },
  {
    id: "caltech",
    name: "Caltech",
    lat: 34.1377,
    lng: -118.1253,
    tags: ["institution", "ev"],
    label: "Institution anchor",
    status: "Research anchor · no partnership implied",
    detail: "Institutional anchor for corridor, site-readiness, and clean-vehicle planning context. No customer relationship is implied.",
  },
  {
    id: "huntington-hospital",
    name: "Hospital / Medical Center context",
    lat: 34.1336,
    lng: -118.1527,
    tags: ["institution", "parking"],
    label: "Healthcare anchor",
    status: "Demonstration site context · no pickup approval implied",
    detail: "Healthcare destination anchor relevant to shift-based commute demand and parking-pressure analysis.",
  },
  {
    id: "glendale-community-college",
    name: "Glendale Community College",
    lat: 34.1667,
    lng: -118.228,
    tags: ["institution", "parking"],
    label: "Institution anchor",
    status: "Research anchor · no partnership implied",
    detail: "Campus anchor used to visualize institutionally relevant commute demand around the Glendale side of the demonstration environment.",
  },
];

const PLANNED_ROUTE_LINES: [number, number][][] = [
  [[34.1469, -118.2551], [34.1399, -118.2248], [34.1462, -118.196], [34.14848, -118.14746], [34.14515, -118.11695]],
  [[34.1396, -118.2078], [34.14848, -118.14746], [34.14515, -118.11695]],
  [[34.1117, -118.1914], [34.14199, -118.14821], [34.15244, -118.11356], [34.14515, -118.11695]],
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
  { id: "transit", label: "Metro / Transit" },
  { id: "shuttle", label: "PCC Shuttle" },
  { id: "parking", label: "Parking" },
  { id: "ev", label: "EV / Charging" },
  { id: "institution", label: "Sites" },
];

const MARKER_COLORS: Record<MapTag, string> = {
  demand: "#a34e86",
  planned: "#6555d8",
  access: "#6555d8",
  transit: "#2674b8",
  shuttle: "#c9791a",
  parking: "#c05848",
  ev: "#278762",
  institution: "#2f7a52",
};

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
    () => filter === "all" ? CORRIDOR_POINTS : CORRIDOR_POINTS.filter((point) => point.tags.includes(filter)),
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
      PLANNED_ROUTE_LINES.forEach((line) => {
        const route = L.polyline(line, { color: "#6555d8", weight: 4, opacity: 0.62, dashArray: "8 7", lineCap: "round" }).addTo(map);
        route.bindTooltip("Simulated planned-route corridor · not guaranteed transportation", { sticky: true, direction: "top" });
      });
    }

    if (filter === "all" || filter === "transit") {
      const aLine = L.polyline(A_LINE_STATION_SPINE, { color: "#2674b8", weight: 3, opacity: 0.62, dashArray: "4 6", lineCap: "round" }).addTo(map);
      aLine.bindTooltip("Metro A Line station linkage · schematic, not live routing", { sticky: true, direction: "top" });
    }

    if (filter === "all" || filter === "shuttle") {
      const shuttle = L.polyline(PCC_SHUTTLE_LINE, { color: "#c9791a", weight: 4, opacity: 0.72, dashArray: "10 6", lineCap: "round" }).addTo(map);
      shuttle.bindTooltip("PCC shuttle connection · schematic, not live vehicle routing", { sticky: true, direction: "top" });
    }

    visiblePoints.forEach((point) => {
      const primaryTag = filter === "all" ? point.tags[0] : filter;
      const isTransfer = point.emphasis === "transfer";
      const isPressure = point.emphasis === "pressure";
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: isTransfer ? 11 : isPressure ? 10 : point.tags.includes("demand") ? 12 : 8,
        weight: isTransfer || isPressure ? 3 : 2,
        color: "#ffffff",
        fillColor: MARKER_COLORS[primaryTag],
        fillOpacity: point.tags.includes("demand") ? 0.72 : 0.96,
        bubblingMouseEvents: false,
      }).addTo(map);
      marker.bindTooltip(point.name, { direction: "top", offset: [0, -8] });
      marker.on("click", () => setSelectedPoint(point));
    });

    const bounds = L.latLngBounds(visiblePoints.map((point) => [point.lat, point.lng] as [number, number]));
    if (filter === "all" || filter === "planned") PLANNED_ROUTE_LINES.flat().forEach((latLng) => bounds.extend(latLng));
    if (filter === "all" || filter === "transit") A_LINE_STATION_SPINE.forEach((latLng) => bounds.extend(latLng));
    if (filter === "all" || filter === "shuttle") PCC_SHUTTLE_LINE.forEach((latLng) => bounds.extend(latLng));
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30], maxZoom: filter === "all" ? 12 : 14 });
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

  function openMap(preferredPoint = experience === "participant" ? "allen-station" : "glendale-demand-zone") {
    keyboard.hide();
    setFilter("all");
    setSelectedPoint(CORRIDOR_POINTS.find((point) => point.id === preferredPoint) ?? CORRIDOR_POINTS[0]);
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
    openMap("allen-station");
  }

  return (
    <div ref={rootRef} className="relay-prototype-root" data-experience={experience} onClickCapture={handleRootClickCapture} data-map-open={mapOpen ? "true" : "false"}>
      <style>{`
        .relay-prototype-root[data-experience="participant"] .bottom-nav button:nth-child(3) { order: 4; }
        .relay-prototype-root[data-experience="participant"] .bottom-nav button:nth-child(4) { order: 3; }
        .relay-prototype-root[data-experience="participant"] .bottom-nav button:nth-child(4) svg { display: none; }
        .relay-prototype-root[data-experience="participant"] .bottom-nav button:nth-child(4)::before { content: "⌖"; font-size: 18px; line-height: 18px; font-weight: 700; }
        .relay-prototype-root[data-experience="participant"] .bottom-nav button:nth-child(4) span { position: relative; color: transparent; }
        .relay-prototype-root[data-experience="participant"] .bottom-nav button:nth-child(4) span::after { position: absolute; inset: 0; color: #8a909b; content: "Map"; font-size: 8px; font-weight: 700; }
        .relay-prototype-root[data-experience="participant"] .bottom-nav button:nth-child(4).active { background: transparent; color: #8a909b; }
        .relay-map-filters { flex-wrap: wrap; overflow: visible; }
        .relay-map-filters button { min-height: 28px; padding-right: 8px; padding-left: 8px; }
        .relay-map-legend i.demand { background: #a34e86; }
        .relay-map-legend i.planned { background: #6555d8; }
        .relay-map-legend i.access { background: #6555d8; }
        .relay-map-legend i.transit { background: #2674b8; }
        .relay-map-legend i.shuttle { background: #c9791a; }
        .relay-map-legend i.parking { background: #c05848; }
        .relay-map-legend i.ev { background: #278762; }
        .relay-map-legend i.institution { background: #2f7a52; }
        .relay-map-tile-status { position: absolute; z-index: 520; top: 12px; left: 12px; max-width: calc(100% - 86px); padding: 8px 10px; border: 1px solid rgba(216,220,227,.95); border-radius: 12px; background: rgba(255,255,255,.94); color: #4c5360; box-shadow: 0 8px 24px rgba(31,36,48,.1); font-size: 10px; font-weight: 700; line-height: 1.3; backdrop-filter: blur(12px); pointer-events: none; }
        .relay-map-tile-status.error { color: #8a3d33; background: rgba(255,246,244,.96); border-color: #efd2cd; }
        .participant-console-return { position: fixed; z-index: 45; right: 16px; top: 82px; min-height: 34px; padding: 0 11px; border: 1px solid #d9d5f0; border-radius: 11px; background: rgba(255,255,255,.96); color: #5146b2; box-shadow: 0 6px 18px rgba(31,36,48,.08); font-size: 9px; font-weight: 800; }
        @media (max-width: 759px) { .participant-console-return { top: 10px; right: 64px; } .relay-prototype-root[data-experience="participant"] .relay-content { padding-top: 58px; } }
        @media (min-width: 760px) { .relay-prototype-root[data-experience="participant"] .bottom-nav button:nth-child(4) span::after { position: static !important; inset: auto !important; color: currentColor !important; font-size: 13px !important; } }
      `}</style>

      {experience === "institution" ? (
        <InstitutionalWorkspace onOpenMap={() => openMap("glendale-demand-zone")} onOpenParticipant={() => setExperience("participant")} />
      ) : (
        <>
          <button className="participant-console-return" onClick={() => { keyboard.hide(); setExperience("institution"); }}>Program Console</button>
          <PrototypePhase1 />
        </>
      )}

      {mapOpen && (
        <section className="relay-map-overlay" aria-label="Interactive Relay Rider mobility map" role="region">
          <header className="relay-map-header">
            <div>
              <span className="relay-map-kicker">MOBILITY INTELLIGENCE MAP · DEMONSTRATION ENVIRONMENT</span>
              <h2>Pasadena–Eagle Rock–Glendale</h2>
              <p>Explore generalized demand, simulated planned-route corridors, Metro/PCC mobility context, candidate Access Points, parking pressure, EV/charging context, and institution anchors.</p>
            </div>
            <button className="relay-map-close" onClick={closeMap} aria-label="Return from mobility map"><Cross2Icon /></button>
          </header>

          <div className="relay-map-filters" aria-label="Map layer filters">
            <LayersIcon />
            {FILTERS.map((item) => <button key={item.id} className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>)}
          </div>

          <div className="relay-map-frame">
            <div ref={mapNodeRef} className="relay-map-canvas" />
            {tileStatus !== "ready" && (
              <div className={`relay-map-tile-status ${tileStatus === "error" ? "error" : ""}`} aria-live="polite">
                {tileStatus === "loading" && "Loading street basemap…"}
                {tileStatus === "fallback" && "Primary basemap unavailable — switching map source…"}
                {tileStatus === "error" && "Basemap could not load. Planning markers remain available while the map source reconnects."}
              </div>
            )}

            <div className="relay-map-legend" aria-label="Map legend">
              <span><i className="demand" />Demand zone</span>
              <span><i className="planned" />Planned route</span>
              <span><i className="access" />Access Point</span>
              <span><i className="transit" />Metro / transit</span>
              <span><i className="parking" />Parking pressure</span>
              <span><i className="ev" />EV / charging</span>
              <span><i className="institution" />Institution</span>
            </div>

            {selectedPoint && (
              <article className="relay-map-detail">
                <div className="relay-map-detail-icon"><SewingPinIcon /></div>
                <div><small>{selectedPoint.label}</small><strong>{selectedPoint.name}</strong><p>{selectedPoint.detail}</p><span>{selectedPoint.status}</span></div>
              </article>
            )}
          </div>

          <p className="relay-map-footnote">Demand zones and planned routes are demonstration/model context, not participant home locations or guaranteed transportation. Transit and shuttle information is scheduled/static planning context rather than live arrival data. Candidate Access Points remain subject to institutional, property, accessibility, visibility, lighting, and general suitability review.</p>
        </section>
      )}
    </div>
  );
}
