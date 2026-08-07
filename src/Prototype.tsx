import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import L, { type Map as LeafletMap, type TileLayer } from "leaflet";
import { Cross2Icon, LayersIcon, SewingPinIcon } from "@radix-ui/react-icons";
import { useKeyboard } from "./mobile";
import PrototypePhase1 from "./PrototypePhase1";
import "leaflet/dist/leaflet.css";
import "./prototype.css";

type MapTag = "access" | "aline" | "shuttle" | "institution";
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
  emphasis?: "transfer";
};

const CORRIDOR_POINTS: CorridorPoint[] = [
  {
    id: "glendale-transit-center",
    name: "Glendale Transportation Center",
    lat: 34.1236,
    lng: -118.2587,
    tags: ["access"],
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
    tags: ["aline", "access"],
    label: "Metro A Line station",
    status: "Transit anchor · PCC shuttle connection not implied",
    detail: "Pasadena A Line station included for multimodal commuter-option previews and approximate-zone coordination.",
  },
  {
    id: "memorial-park",
    name: "Memorial Park Station",
    lat: 34.14848,
    lng: -118.14746,
    tags: ["aline", "access"],
    label: "Metro A Line station",
    status: "Transit anchor · PCC shuttle connection not implied",
    detail: "Central Pasadena A Line station for rail-linked commute previews. Relay Rider does not label it as a PCC shuttle stop.",
  },
  {
    id: "lake-station",
    name: "Lake Station",
    lat: 34.15181,
    lng: -118.13212,
    tags: ["aline"],
    label: "Metro A Line station",
    status: "Transit anchor · PCC shuttle connection not implied",
    detail: "Pasadena A Line station shown as a nearby rail option for institution-focused commute planning.",
  },
  {
    id: "allen-station",
    name: "Allen Station · PCC Shuttle Connection",
    lat: 34.15244,
    lng: -118.11356,
    tags: ["shuttle", "aline", "access"],
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
    tags: ["aline"],
    label: "Metro A Line station",
    status: "Transit anchor · PCC shuttle connection not implied",
    detail: "East Pasadena A Line station included for multimodal access and corridor-demand context.",
  },
  {
    id: "pcc-colorado-shuttle",
    name: "PCC Colorado Campus · Lots 6 & 7",
    lat: 34.14515,
    lng: -118.11695,
    tags: ["shuttle", "institution"],
    label: "PCC Shuttle boarding area",
    status: "Published boarding area · approximate map pin",
    detail: "PCC describes the Colorado Campus shuttle stop on the northeast side of campus between parking lots 6 and 7. The pin is approximate rather than a surveyed curb location.",
  },
  {
    id: "pcc-foothill-shuttle",
    name: "PCC Foothill Campus · Lot C",
    lat: 34.15072,
    lng: -118.08644,
    tags: ["shuttle", "institution"],
    label: "PCC Shuttle boarding area",
    status: "Published boarding area · approximate campus pin",
    detail: "PCC identifies Parking Lot C as the Foothill Campus shuttle boarding area. The prototype pin represents the campus/lot area, not a surveyed curb position.",
  },
  {
    id: "pcc-jefferson",
    name: "PCC Jefferson Training Center",
    lat: 34.15492,
    lng: -118.11881,
    tags: ["shuttle", "institution"],
    label: "PCC-affiliated shuttle-network site",
    status: "Boarding location pending confirmation",
    detail: "PCC identifies Jefferson as part of its shuttle-served campus network, but the current transportation page does not publish a precise Jefferson boarding point. This pin represents the site only.",
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

const CORRIDOR_LINE: [number, number][] = [
  [34.1236, -118.2587],
  [34.1399, -118.2248],
  [34.1462, -118.196],
  [34.14848, -118.14746],
  [34.14515, -118.11695],
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
  { id: "access", label: "Access Points" },
  { id: "aline", label: "A Line" },
  { id: "shuttle", label: "PCC Shuttle" },
  { id: "institution", label: "Institutions" },
];

const MARKER_COLORS: Record<MapTag, string> = {
  access: "#6555d8",
  aline: "#2674b8",
  shuttle: "#c9791a",
  institution: "#2f7a52",
};

export default function Prototype() {
  const keyboard = useKeyboard();
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
    const mapTab = rootRef.current?.querySelector<HTMLButtonElement>(".bottom-nav button:nth-child(4)");
    if (!mapTab) return;

    const previousLabel = mapTab.getAttribute("aria-label");
    mapTab.setAttribute("aria-label", "Map");

    return () => {
      if (previousLabel) mapTab.setAttribute("aria-label", previousLabel);
      else mapTab.removeAttribute("aria-label");
    };
  }, []);

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

      if (activeTileLayer && map.hasLayer(activeTileLayer)) {
        map.removeLayer(activeTileLayer);
      }

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

    if (filter === "all" || filter === "access") {
      const corridor = L.polyline(CORRIDOR_LINE, {
        color: "#6555d8",
        weight: 4,
        opacity: 0.56,
        dashArray: "8 8",
        lineCap: "round",
      }).addTo(map);

      corridor.bindTooltip("Modeled research corridor · not a guaranteed route", {
        sticky: true,
        direction: "top",
      });
    }

    if (filter === "all" || filter === "aline") {
      const aLine = L.polyline(A_LINE_STATION_SPINE, {
        color: "#2674b8",
        weight: 3,
        opacity: 0.58,
        dashArray: "4 6",
        lineCap: "round",
      }).addTo(map);

      aLine.bindTooltip("Metro A Line station linkage · schematic, not exact track geometry", {
        sticky: true,
        direction: "top",
      });
    }

    if (filter === "all" || filter === "shuttle") {
      const shuttle = L.polyline(PCC_SHUTTLE_LINE, {
        color: "#c9791a",
        weight: 4,
        opacity: 0.72,
        dashArray: "10 6",
        lineCap: "round",
      }).addTo(map);

      shuttle.bindTooltip("PCC shuttle connection · schematic, not live vehicle routing", {
        sticky: true,
        direction: "top",
      });
    }

    visiblePoints.forEach((point) => {
      const primaryTag = filter === "all" ? point.tags[0] : filter;
      const isTransfer = point.emphasis === "transfer";
      const isShuttleStop = point.tags.includes("shuttle");
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: isTransfer ? 11 : isShuttleStop ? 9 : 8,
        weight: isTransfer ? 3 : 2,
        color: "#ffffff",
        fillColor: MARKER_COLORS[primaryTag],
        fillOpacity: 0.96,
        bubblingMouseEvents: false,
      }).addTo(map);

      marker.bindTooltip(point.name, {
        direction: "top",
        offset: [0, -8],
      });

      marker.on("click", () => setSelectedPoint(point));
    });

    const bounds = L.latLngBounds(visiblePoints.map((point) => [point.lat, point.lng] as [number, number]));
    if (filter === "all" || filter === "access") CORRIDOR_LINE.forEach((latLng) => bounds.extend(latLng));
    if (filter === "all" || filter === "aline") A_LINE_STATION_SPINE.forEach((latLng) => bounds.extend(latLng));
    if (filter === "all" || filter === "shuttle") PCC_SHUTTLE_LINE.forEach((latLng) => bounds.extend(latLng));

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
    if (selectedPoint && !visiblePoints.some((point) => point.id === selectedPoint.id)) {
      setSelectedPoint(null);
    }
  }, [selectedPoint, visiblePoints]);

  function openMap() {
    keyboard.hide();
    setSelectedPoint(CORRIDOR_POINTS.find((point) => point.id === "allen-station") ?? CORRIDOR_POINTS[0]);
    setTileStatus("loading");
    setMapOpen(true);
  }

  function closeMap() {
    setMapOpen(false);
    setSelectedPoint(null);
  }

  function handleRootClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const mapTab = target.closest(".bottom-nav button:nth-child(4)");
    if (!mapTab) return;

    event.preventDefault();
    event.stopPropagation();
    openMap();
  }

  return (
    <div ref={rootRef} className="relay-prototype-root" onClickCapture={handleRootClickCapture} data-map-open={mapOpen ? "true" : "false"}>
      <style>{`
        .relay-prototype-root .bottom-nav button:nth-child(3) { order: 4; }
        .relay-prototype-root .bottom-nav button:nth-child(4) { order: 3; }
        .relay-prototype-root .bottom-nav button:nth-child(4) svg { display: none; }
        .relay-prototype-root .bottom-nav button:nth-child(4)::before {
          content: "⌖";
          font-size: 18px;
          line-height: 18px;
          font-weight: 700;
        }
        .relay-prototype-root .bottom-nav button:nth-child(4) span {
          position: relative;
          color: transparent;
        }
        .relay-prototype-root .bottom-nav button:nth-child(4) span::after {
          position: absolute;
          inset: 0;
          color: #8a909b;
          content: "Map";
          font-size: 8px;
          font-weight: 700;
        }
        .relay-prototype-root .bottom-nav button:nth-child(4).active {
          background: transparent;
          color: #8a909b;
        }
        .relay-prototype-root .bottom-nav button:nth-child(4).active span::after {
          color: #8a909b;
        }
        .relay-map-tile-status {
          position: absolute;
          z-index: 520;
          top: 12px;
          left: 12px;
          max-width: calc(100% - 86px);
          padding: 8px 10px;
          border: 1px solid rgba(216, 220, 227, 0.95);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.94);
          color: #4c5360;
          box-shadow: 0 8px 24px rgba(31, 36, 48, 0.1);
          font-size: 10px;
          font-weight: 700;
          line-height: 1.3;
          backdrop-filter: blur(12px);
          pointer-events: none;
        }
        .relay-map-tile-status.error {
          color: #8a3d33;
          background: rgba(255, 246, 244, 0.96);
          border-color: #efd2cd;
        }
      `}</style>

      <PrototypePhase1 />

      {mapOpen && (
        <section className="relay-map-overlay" aria-label="Interactive Relay Rider corridor map" role="region">
          <header className="relay-map-header">
            <div>
              <span className="relay-map-kicker">PCC + METRO MOBILITY MAP</span>
              <h2>Pasadena–Eagle Rock–Glendale</h2>
              <p>Explore A Line stations, PCC shuttle connections, institutional anchors, and candidate Access Points.</p>
            </div>
            <button className="relay-map-close" onClick={closeMap} aria-label="Return from corridor map"><Cross2Icon /></button>
          </header>

          <div className="relay-map-filters" aria-label="Map layer filters">
            <LayersIcon />
            {FILTERS.map((item) => (
              <button
                key={item.id}
                className={filter === item.id ? "active" : ""}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relay-map-frame">
            <div ref={mapNodeRef} className="relay-map-canvas" />

            {tileStatus !== "ready" && (
              <div className={`relay-map-tile-status ${tileStatus === "error" ? "error" : ""}`} aria-live="polite">
                {tileStatus === "loading" && "Loading street basemap…"}
                {tileStatus === "fallback" && "Primary basemap unavailable — switching map source…"}
                {tileStatus === "error" && "Basemap could not load. Corridor markers remain available while the map source reconnects."}
              </div>
            )}

            <div className="relay-map-legend" aria-label="Map legend">
              <span><i className="access" />Access Point candidate</span>
              <span><i className="aline" />Metro A Line</span>
              <span><i className="shuttle" />PCC Shuttle</span>
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
            Metro and PCC shuttle connections are mobility-planning context, not guaranteed itineraries. PCC boarding-area pins are approximate where published material does not provide coordinates; Jefferson's precise shuttle boarding point remains pending confirmation. Candidate Access Points remain subject to administrative and site review.
          </p>
        </section>
      )}
    </div>
  );
}
